export interface Prediction {
    token: number;
    text: string;
    probability: number;
    start: number; // Cumulative probability based start 0 to 1
    end: number;
}

export default function filterTokens(vocab: string[], probabilities: number[]): Prediction[] {
    const filtered: Prediction[] = [];
    for (let i = 0; i < vocab.length; i++) {
        const token = i;
        const text = vocab[i];
        const probability = probabilities[i];
        if (probability > 0.0001) {
            filtered.push({ token, text, probability, start: 0, end: 0 });
        }
    }

    let cumulative = 0;
    for (const p of filtered) {
        p.start = cumulative;
        cumulative += p.probability;
        p.end = cumulative;
    }

    return filtered;
}
