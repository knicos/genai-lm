export interface Anchor {
    queryIndex: number;
    dataIndex: number;
}

export interface ChainedContext {
    chain: Anchor[];
    score: number;
}

export interface ContextMatchResult {
    prefix: ChainedContext;
    suffix: ChainedContext;
    /** Combined score, useful for ranking multiple candidate matches. */
    totalScore: number;
}

export interface ChainOptions {
    /** Reward per anchor included in the chain. */
    matchScore?: number;
    /** Flat cost incurred whenever a gap is introduced at all. */
    gapOpenPenalty?: number;
    /** Additional cost per token of gap length (the larger of query/data gap). */
    gapExtendPenalty?: number;
    /** Extra cost for imbalance between query-gap and data-gap length
     *  (i.e. an effective insertion/deletion rather than a shared skip). */
    driftPenalty?: number;
}

const DEFAULT_OPTIONS: Required<ChainOptions> = {
    matchScore: 4,
    gapOpenPenalty: 2,
    gapExtendPenalty: 0.5,
    driftPenalty: 0.25,
};

/** Build all exact-match candidate anchors between two token sequences. */
function buildAnchors(query: number[] | Uint16Array, data: number[] | Uint16Array): Anchor[] {
    const positionsByToken = new Map<number, number[]>();
    data.forEach((tok, i) => {
        const list = positionsByToken.get(tok);
        if (list) list.push(i);
        else positionsByToken.set(tok, [i]);
    });

    const anchors: Anchor[] = [];
    query.forEach((tok, qi) => {
        const positions = positionsByToken.get(tok);
        if (!positions) return;
        for (const di of positions) anchors.push({ queryIndex: qi, dataIndex: di });
    });

    // Required for the DP below: process in query order, then data order.
    anchors.sort((a, b) => a.queryIndex - b.queryIndex || a.dataIndex - b.dataIndex);
    return anchors;
}

/** Affine-ish gap cost: open cost + per-token extend cost + drift penalty. */
function gapPenalty(qGap: number, dGap: number, opts: Required<ChainOptions>): number {
    if (qGap <= 0 && dGap <= 0) return 0;
    const gapLen = Math.max(qGap, dGap);
    const drift = Math.abs(qGap - dGap);
    return opts.gapOpenPenalty + opts.gapExtendPenalty * gapLen + opts.driftPenalty * drift;
}

/**
 * O(n^2) chaining DP (fine for small context windows; swap for an
 * O(n log n) LIS-style sweep if context windows get large).
 *
 * Finds the highest-scoring subsequence of anchors that is strictly
 * increasing in both queryIndex and dataIndex (order-preserving,
 * gaps allowed between consecutive anchors in either sequence).
 */
function chainAnchors(anchors: Anchor[], opts: Required<ChainOptions>): ChainedContext {
    const n = anchors.length;
    if (n === 0) return { chain: [], score: 0 };

    const dp = new Array<number>(n).fill(0);
    const prev = new Array<number>(n).fill(-1);

    for (let i = 0; i < n; i++) {
        dp[i] = opts.matchScore;
        prev[i] = -1;
        for (let j = 0; j < i; j++) {
            if (anchors[j].queryIndex < anchors[i].queryIndex && anchors[j].dataIndex < anchors[i].dataIndex) {
                const qGap = anchors[i].queryIndex - anchors[j].queryIndex - 1;
                const dGap = anchors[i].dataIndex - anchors[j].dataIndex - 1;
                const candidate = dp[j] + opts.matchScore - gapPenalty(qGap, dGap, opts);
                if (candidate > dp[i]) {
                    dp[i] = candidate;
                    prev[i] = j;
                }
            }
        }
    }

    let bestIdx = 0;
    for (let i = 1; i < n; i++) if (dp[i] > dp[bestIdx]) bestIdx = i;

    const chain: Anchor[] = [];
    for (let cur = bestIdx; cur !== -1; cur = prev[cur]) chain.push(anchors[cur]);
    chain.reverse();

    return { chain, score: dp[bestIdx] };
}

export function matchContext(
    queryPrefix: number[] | Uint16Array,
    dataPrefix: number[] | Uint16Array,
    querySuffix: number[] | Uint16Array,
    dataSuffix: number[] | Uint16Array,
    options: ChainOptions = {}
): ContextMatchResult {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    // --- Prefix: reverse so index 0 = token adjacent to the match ---
    const qPrefRev = [...queryPrefix].reverse();
    const dPrefRev = [...dataPrefix].reverse();

    const prefixAnchors = buildAnchors(qPrefRev, dPrefRev);
    const prefixChainRev = chainAnchors(prefixAnchors, opts);

    // Map reversed indices back to original prefix coordinates, restoring
    // ascending (original reading) order.
    const prefixChain: ChainedContext = {
        score: prefixChainRev.score,
        chain: prefixChainRev.chain
            .map((a) => ({
                queryIndex: queryPrefix.length - 1 - a.queryIndex,
                dataIndex: dataPrefix.length - 1 - a.dataIndex,
            }))
            .reverse(),
    };

    // --- Suffix: already in the right orientation (index 0 = adjacent) ---
    const suffixAnchors = buildAnchors(querySuffix, dataSuffix);
    const suffixChain = chainAnchors(suffixAnchors, opts);

    return {
        prefix: prefixChain,
        suffix: suffixChain,
        totalScore: prefixChain.score + suffixChain.score,
    };
}
