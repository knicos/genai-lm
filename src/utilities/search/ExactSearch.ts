import { tokenise } from '@genai-fi/nanogpt';
import BloomSearch from './BloomSearch';
import EE from 'eventemitter3';
import ResultBuffer from './ResultBuffer';
import { mix32 } from './bloomFilter';

const DEFAULT_BLOCK_SIZE = 10_240;
const TARGET_FALSE_POSITIVE_RATE = 0.01;
const MIN_M_BITS = 1_024;
const MIN_CANDIDATE_BLOCKS = 12;
const MAX_CANDIDATE_BLOCKS = 48;
const MAX_RETURNED_POSITIONS = 16;
const MAX_FILTERS = 10000;
const DEFAULT_CONTEXT_SIZE = 0;

interface ExactSearchEvents {
    status: (status: 'indexing' | 'ready' | 'searching' | 'notready') => void;
    error: (error: Error) => void;
    indexProgress: (progress: number) => void;
}

export interface ExactSearchOptions {
    maxResults?: number;
    contextSize?: number;
}

export interface ExactSearchResult {
    position: number;
    queryPosition: number;
    matchLength: number;
    blockIndex: number;
    blockBloomScore: number;
    score: number;
    matchPrefix?: number[]; // Tokens immediately preceding the match
    matchSuffix?: number[]; // Tokens immediately following the match
}

interface ResultInformation {
    results: ExactSearchResult[];
    exactMatches: number;
    approximate: boolean;
    estimatedMatches: number;
}

function hashNGram(ngram: Uint16Array | number[] | Uint32Array, start: number, end: number): number {
    let h1 = 0x9e3779b9 >>> 0; // 32-bit golden ratio

    for (let i = start; i < end; i++) {
        const token = ngram[i];
        const t = (token >>> 0) + 1;
        h1 = mix32((h1 ^ t) >>> 0);
    }

    return h1 >>> 0;
}

function createQueryIndex(tokens: Uint32Array, n: number): Map<number, number> {
    const set = new Map<number, number>();
    for (let i = 0; i <= tokens.length - n; i++) {
        const h1 = hashNGram(tokens, i, i + n);
        if (set.has(h1)) {
            // Keep only minimum i.
            continue;
        }
        set.set(h1, i);
    }
    return set;
}

export default class ExactSearch extends EE<ExactSearchEvents> {
    private tokens: tokenise.TokenStore;
    private n: number;
    private bloomSearch: BloomSearch;
    private blockSize: number;
    private _status: 'indexing' | 'ready' | 'searching' | 'notready' = 'notready';
    public get status(): 'indexing' | 'ready' | 'searching' | 'notready' {
        return this._status;
    }

    private set status(value: 'indexing' | 'ready' | 'searching' | 'notready') {
        this._status = value;
        this.emit('status', value);
    }

    constructor(tokens: tokenise.TokenStore, n: number) {
        super();
        if (!Number.isInteger(n) || n <= 0) {
            throw new Error('n must be a positive integer');
        }

        this.tokens = tokens;
        this.n = n;
        this.blockSize = Math.max(DEFAULT_BLOCK_SIZE, Math.ceil(tokens.getTokenCount() / MAX_FILTERS));

        const estimatedNGramsPerBlock = Math.max(1, this.blockSize - this.n + 1);
        const m = Math.max(
            MIN_M_BITS,
            Math.ceil(-((estimatedNGramsPerBlock * Math.log(TARGET_FALSE_POSITIVE_RATE)) / (Math.log(2) * Math.log(2))))
        );
        const k = Math.max(1, Math.round((m / estimatedNGramsPerBlock) * Math.log(2)));

        this.bloomSearch = new BloomSearch(tokens, n, m, k, this.blockSize);
        this.bloomSearch.on('status', (status) => {
            if (status === 'indexing') {
                this.status = 'indexing';
            } else if (status === 'ready') {
                this.status = 'ready';
            }
        });
        this.bloomSearch.on('error', (error) => this.emit('error', error));
        this.bloomSearch.on('indexProgress', (progress) => this.emit('indexProgress', progress));
    }

    public assertReady(): Promise<void> {
        return this.bloomSearch.initialize();
    }

    public async search(tokens: number[], options: ExactSearchOptions = {}): Promise<ResultInformation> {
        await this.bloomSearch.initialize();
        this.status = 'searching';
        const results = await this.findLongestExactMatches(tokens, options.maxResults, options.contextSize);
        this.status = 'ready';
        return results;
    }

    public async findLongestExactMatches(
        tokens: number[],
        maxResults = MAX_RETURNED_POSITIONS,
        contextSize = DEFAULT_CONTEXT_SIZE
    ): Promise<ResultInformation> {
        const query = Uint32Array.from(tokens);
        if (query.length === 0) {
            return {
                results: [],
                exactMatches: 0,
                approximate: false,
                estimatedMatches: 0,
            };
        }

        const resolvedExactN = this.n;

        const blockScores = await this.bloomSearch.search(tokens);
        const totalTokens = this.tokens.getTokenCount();
        if (totalTokens <= 0 || blockScores.length === 0) {
            return {
                results: [],
                exactMatches: 0,
                approximate: false,
                estimatedMatches: 0,
            };
        }

        const saturation = tokens.length - this.n + 1;
        const candidateInfo = this.getCandidateBlocks(blockScores, saturation);
        const candidateBlocks = candidateInfo.topBlockIndices;

        if (candidateBlocks.length === 0) {
            return {
                results: [],
                exactMatches: 0,
                approximate: false,
                estimatedMatches: 0,
            };
        }

        const anchorLength = Math.max(1, Math.min(resolvedExactN, query.length));
        const queryAnchorCount = query.length - anchorLength + 1;
        const matches = new ResultBuffer<ExactSearchResult>(maxResults, query.length);

        const qIndex = createQueryIndex(query, anchorLength);

        for (const blockIndex of candidateBlocks) {
            const blockStart = blockIndex * this.blockSize;
            const blockEnd = Math.min(blockStart + this.blockSize, totalTokens);
            const scanStart = Math.max(0, blockStart - (anchorLength - 1));
            const scanEnd = Math.min(totalTokens, blockEnd + (anchorLength - 1));
            const region = await this.getSlice(scanStart, scanEnd);
            const regionAnchorCount = region.length - anchorLength + 1;
            if (regionAnchorCount <= 0) {
                continue;
            }

            const blockBloomScore = blockScores[blockIndex] ?? 0;

            for (let localPos = 0; localPos < regionAnchorCount; localPos++) {
                const h1 = hashNGram(region, localPos, localPos + anchorLength);

                const qI = qIndex.get(h1);
                if (qI === undefined) {
                    continue;
                }

                for (let queryStart = qI; queryStart < queryAnchorCount; queryStart++) {
                    if (!this.ngramEquals(region, localPos, query, queryStart, anchorLength)) {
                        continue;
                    }

                    const absoluteAnchorPos = scanStart + localPos;

                    const candidate: ExactSearchResult = {
                        position: absoluteAnchorPos,
                        queryPosition: queryStart,
                        matchLength: anchorLength,
                        blockIndex,
                        blockBloomScore,
                        score: anchorLength,
                    };

                    this.extendCandidate(region, localPos, query, candidate);

                    if (contextSize > 0) {
                        if (localPos >= contextSize) {
                            candidate.matchPrefix = Array.from(
                                region.slice(Math.max(0, localPos - contextSize), localPos)
                            );
                        } else {
                            candidate.matchPrefix = Array.from(
                                await this.tokens.slice(absoluteAnchorPos, absoluteAnchorPos + contextSize)
                            );
                        }
                        if (localPos + candidate.matchLength + contextSize <= region.length) {
                            candidate.matchSuffix = Array.from(
                                region.slice(
                                    localPos + candidate.matchLength,
                                    localPos + candidate.matchLength + contextSize
                                )
                            );
                        } else {
                            candidate.matchSuffix = Array.from(
                                await this.tokens.slice(
                                    absoluteAnchorPos + candidate.matchLength,
                                    absoluteAnchorPos + candidate.matchLength + contextSize
                                )
                            );
                        }
                    }

                    localPos += candidate.matchLength - 1;

                    matches.add(candidate);
                    break;
                }
            }
        }

        const allResults = matches.getAll();

        return {
            results: allResults,
            exactMatches: matches.perfectCount,
            approximate: candidateInfo.exactBlocks > candidateBlocks.length,
            estimatedMatches:
                candidateInfo.exactBlocks > candidateBlocks.length
                    ? Math.round((allResults.length / candidateBlocks.length) * candidateInfo.exactBlocks)
                    : matches.perfectCount,
        };
    }

    private getCandidateBlocks(
        blockScores: number[],
        saturation: number
    ): { topBlockIndices: number[]; exactBlocks: number } {
        const ranked = blockScores
            .map((score, blockIndex) => ({ score, blockIndex }))
            .filter((entry) => entry.score > 0)
            .sort((a, b) => {
                if (b.score !== a.score) {
                    return b.score - a.score;
                }
                return a.blockIndex - b.blockIndex;
            });

        if (ranked.length === 0) {
            return { topBlockIndices: [], exactBlocks: 0 };
        }

        let takeCount = 0;
        let saturatedCount = 0;
        for (; takeCount < ranked.length; takeCount++) {
            if (ranked[takeCount].score >= saturation) {
                saturatedCount += 1;
            }
            if (ranked[takeCount].score < saturation && takeCount >= MIN_CANDIDATE_BLOCKS) {
                break;
            }
        }

        takeCount = Math.min(takeCount, MAX_CANDIDATE_BLOCKS);
        const topBlockIndices = ranked.slice(0, takeCount).map((entry) => entry.blockIndex);
        return { topBlockIndices, exactBlocks: saturatedCount };
    }

    private ngramEquals(
        region: Uint16Array,
        offset: number,
        queryNGram: Uint32Array,
        qOffset: number,
        length: number
    ): boolean {
        for (let i = 0; i < length; i++) {
            if (region[offset + i] !== queryNGram[qOffset + i]) {
                return false;
            }
        }
        return true;
    }

    private extendCandidate(
        region: Uint16Array,
        regionAnchorStart: number,
        query: Uint32Array,
        candidate: ExactSearchResult
    ) {
        const queryAnchorStart = candidate.queryPosition;
        const anchorLength = candidate.matchLength;
        let right = 0;
        while (
            regionAnchorStart + anchorLength + right < region.length &&
            queryAnchorStart + anchorLength + right < query.length &&
            region[regionAnchorStart + anchorLength + right] === query[queryAnchorStart + anchorLength + right]
        ) {
            right += 1;
        }

        candidate.matchLength += right;
        candidate.score += right;
    }

    private getSlice(start: number, end: number): Promise<Uint16Array> {
        return this.tokens.slice(start, end);
    }
}
