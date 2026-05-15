export function reduceAttention(attentionData: number[][][][]): number[][] {
    // layer, head, _, sequence
    // Reduce to layer and sequence by taking the max over heads
    const reduced: number[][] = [];
    for (const layerData of attentionData) {
        const seqLength = layerData[0][0].length;
        const sums = new Array(seqLength).fill(0);
        let overallMax = 0;

        for (const head of layerData) {
            for (let i = 0; i < seqLength; i++) {
                const v = head[0][i];
                overallMax = Math.max(overallMax, v);
                sums[i] = Math.max(sums[i], v);
            }
        }

        // Normalize
        for (let i = 0; i < seqLength; i++) {
            sums[i] = sums[i] / overallMax;
        }
        reduced.push(sums);
    }
    return reduced;
}
