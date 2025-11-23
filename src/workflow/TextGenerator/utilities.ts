import { CharTokeniser } from '@genai-fi/nanogpt';
import { ProbabilityItem } from '../../components/TextHighlighter/TextHighlighter';

export function createProbabilitiesForHead(
    attentionData: number[][][][][],
    offset: number,
    index: number,
    layer: number,
    head: number
): ProbabilityItem[] {
    if (index < 0 || layer < 0 || head < 0) return [];
    const data = attentionData[index][layer][head][0];
    if (!data) return [];
    const realIndex = Math.min(index + offset - 1, data.length - 1);
    const probabilities = new Array(attentionData.length).fill(0);
    for (let i = 0; i <= realIndex; i++) {
        const idx = index - realIndex + i - 1;
        if (idx >= 0) {
            probabilities[idx] = data[i] || 0;
        }
    }

    // Exaggerate and normalize
    const exaggerated = adaptiveExaggerateAndNormalize(probabilities, 2);
    return probabilities.map((_, i) => ({ index: head, probability: exaggerated[i] }));
}

export function adaptiveExaggerateAndNormalize(scores: number[], maxExp: number): number[] {
    if (scores.length === 0) return [];
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;

    // Exaggeration: higher power for lower variance (flatter attention)
    // Clamp exponent between 1.5 and 4 for stability
    const exponent = Math.max(1.5, Math.min(maxExp, maxExp - variance * 6));

    // Apply power scaling
    const exaggerated = scores.map((s) => Math.pow(s, exponent));

    // Normalize so max value is 1
    const maxVal = Math.max(...exaggerated, 1e-8);
    return exaggerated.map((s) => s / maxVal);
}

export function createProbabilities(
    attentionData: number[][][][][],
    offset: number,
    index: number,
    layer: number
): ProbabilityItem[] {
    if (index < 0 || layer < 0) return [];
    const headresults: ProbabilityItem[][] = [];
    const numHeads = attentionData[0]?.[0]?.length || 0;
    for (let h = 0; h < numHeads; h++) {
        const headProbabilities = createProbabilitiesForHead(attentionData, offset, index, layer, h);
        headresults.push(headProbabilities);
    }

    const result: ProbabilityItem[] = [];
    for (let i = 0; i < headresults[0]?.length || 0; i++) {
        // Select the maximum head probability for each token
        let maxProb = 0;
        let maxHead = -1;
        for (let h = 0; h < headresults.length; h++) {
            if (headresults[h][i] && headresults[h][i].probability > maxProb) {
                maxProb = headresults[h][i].probability;
                maxHead = headresults[h][i].index;
            }
        }
        result.push({ index: maxHead, probability: maxProb });
    }

    return result;
}

export function createTopKTokens(
    probabilities: number[],
    k: number,
    tokeniser: CharTokeniser
): { token: string; probability: number }[] {
    const tokenProbabilities = probabilities.map((prob, idx) => ({
        token: tokeniser.vocab[idx],
        probability: prob,
    }));
    tokenProbabilities.sort((a, b) => b.probability - a.probability);
    return tokenProbabilities.slice(0, k);
}
