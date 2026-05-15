import filterTokens, { Prediction } from './filterTokens';

export default function padPredictions(
    predictions: number[],
    vocab: string[],
    size: number,
    target: number | null
): Prediction[] {
    if (predictions.length === 0) {
        return Array(size).fill({ token: -1, text: '', probability: 0, start: 0, end: 0 });
    }
    const filtered = filterTokens(vocab, predictions);
    filtered.sort((a, b) => b.probability - a.probability);
    const sliced = filtered.slice(0, size);
    if (target !== null) {
        const hasTarget = sliced.find((p) => p.token === target);
        if (!hasTarget) {
            sliced.pop();

            const filteredHasTarget = filtered.find((p) => p.token === target);
            if (filteredHasTarget) {
                sliced.push(filteredHasTarget);
            } else {
                sliced.push({
                    token: target ?? 0,
                    text: vocab[target ?? 0],
                    probability: predictions[target ?? 0],
                    start: 0,
                    end: 0,
                });
            }
        }
    }
    const paddedPredictions =
        sliced.length < size
            ? [
                  ...sliced,
                  ...Array(size - sliced.length).fill({ token: -1, text: '', probability: 0, start: 0, end: 0 }),
              ]
            : sliced;
    return paddedPredictions;
}
