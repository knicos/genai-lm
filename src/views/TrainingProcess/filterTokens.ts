export default function filterTokens(
    vocab: string[],
    probabilities: number[]
): { token: number; text: string; probability: number }[] {
    const filtered: { token: number; text: string; probability: number }[] = [];
    for (let i = 0; i < vocab.length; i++) {
        const token = i;
        const text = vocab[i];
        const probability = probabilities[i];
        if (probability > 0.001) {
            filtered.push({ token, text, probability });
        }
    }
    return filtered;
}
