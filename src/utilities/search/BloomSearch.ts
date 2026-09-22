import { tokenise } from '@genai-fi/nanogpt';
import { createNGramBloom, buildBloomIndices, hasBloomMembership } from './bloomFilter';
import EE from 'eventemitter3';
import { yieldIfNeeded } from '../yielder';

interface BloomSearchEvents {
    status: (status: 'indexing' | 'ready' | 'searching' | 'notready') => void;
    error: (error: Error) => void;
    indexProgress: (progress: number) => void;
}

export default class BloomSearch extends EE<BloomSearchEvents> {
    private tokens: tokenise.TokenStore;
    private n: number;
    private m: number;
    private k: number;
    private blockSize: number;
    private blooms: Uint8Array[] = [];
    private ready = false;
    private initPromise: Promise<void> | null = null;
    private _status: 'indexing' | 'ready' | 'searching' | 'notready' = 'notready';
    private startTime = -1;

    constructor(tokens: tokenise.TokenStore, n: number, m: number, k: number, blockSize: number) {
        super();
        if (!Number.isInteger(n) || n <= 0) {
            throw new Error('n must be a positive integer');
        }
        if (!Number.isInteger(m) || m <= 0) {
            throw new Error('m must be a positive integer (number of bits)');
        }
        if (!Number.isInteger(k) || k <= 0) {
            throw new Error('k must be a positive integer (number of hash probes)');
        }
        if (!Number.isInteger(blockSize) || blockSize <= 0) {
            throw new Error('blockSize must be a positive integer');
        }

        this.tokens = tokens;
        this.n = n;
        this.m = m;
        this.k = k;
        this.blockSize = blockSize;
    }

    public get status(): 'indexing' | 'ready' | 'searching' | 'notready' {
        return this._status;
    }

    private set status(value: 'indexing' | 'ready' | 'searching' | 'notready') {
        this._status = value;
        this.emit('status', value);
    }

    public get size(): number {
        return this.blooms.reduce((acc, bloom) => acc + bloom.length, 0);
    }

    public async initialize() {
        if (this.ready) {
            return;
        }
        if (!this.initPromise) {
            this.initPromise = (async () => {
                try {
                    this.status = 'indexing';
                    await this.buildBlooms();
                    this.status = 'ready';
                } catch (error) {
                    this.emit('error', error as Error);
                }
            })();
        }
        await this.initPromise;
    }

    // Return number of ngram matches within each block of tokens to give match density
    public async search(tokens: number[]): Promise<number[]> {
        await this.initialize();
        this.status = 'searching';

        const blockCount = this.blooms.length;
        if (blockCount === 0 || tokens.length < this.n) {
            return new Array(blockCount).fill(0);
        }

        const queryTokens = Uint16Array.from(tokens);
        const maxStart = queryTokens.length - this.n;
        const counts = new Array(blockCount).fill(0);

        for (let start = 0; start <= maxStart; start++) {
            const ngram = queryTokens.subarray(start, start + this.n);

            const indices = buildBloomIndices(ngram, this.m, this.k);

            for (let blockIndex = 0; blockIndex < blockCount; blockIndex++) {
                if (hasBloomMembership(this.blooms[blockIndex], indices)) {
                    counts[blockIndex] += 1;
                }
            }
        }

        this.status = 'ready';
        return counts;
    }

    private async buildShardBlooms(blockStartIndex: number, shard: Uint16Array) {
        const totalTokens = shard.length;
        if (totalTokens <= 0) {
            return;
        }

        const blockCount = Math.ceil(totalTokens / this.blockSize);

        for (let blockIndex = 0; blockIndex < blockCount; blockIndex++) {
            const start = Math.max(0, blockIndex * this.blockSize - (this.n - 1));
            const end = Math.min(start + this.blockSize + (this.n - 1), totalTokens);
            const slice = shard.subarray(start, end);
            this.blooms[blockStartIndex + blockIndex] = createNGramBloom(slice, this.n, this.m, this.k);
            this.startTime = await yieldIfNeeded(this.startTime, () => {
                this.emit('indexProgress', (blockStartIndex + blockIndex) / this.blooms.length);
            });
        }
    }

    private async buildBlooms(): Promise<void> {
        this.startTime = performance.now();
        const totalTokens = this.tokens.getTokenCount();
        if (totalTokens <= 0) {
            this.blooms = [];
            return;
        }

        const blockCount = Math.ceil(totalTokens / this.blockSize);
        this.blooms = new Array(blockCount);

        const shardCount = this.tokens.getShardCount();
        let blockStartIndex = 0;
        for (let shardIndex = 0; shardIndex < shardCount; shardIndex++) {
            const shard = await this.tokens.getShard(shardIndex);
            await this.buildShardBlooms(blockStartIndex, shard);
            blockStartIndex += Math.ceil(shard.length / this.blockSize);
        }
    }
}
