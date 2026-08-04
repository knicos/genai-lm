import { describe, it } from 'vitest';
import padPredictions from './paddedPredictions';

describe('padPredictions', () => {
    it('pads empty predictions to requested size', ({ expect }) => {
        const padded = padPredictions([], ['a', 'b'], 3, null);
        expect(padded).toHaveLength(3);
        expect(padded.every((p) => p.token === -1)).toBe(true);
    });

    it('keeps target token in output set when requested', ({ expect }) => {
        const padded = padPredictions([0.7, 0.2, 0.1], ['a', 'b', 'c'], 2, 2);
        expect(padded).toHaveLength(2);
        expect(padded.some((p) => p.token === 2)).toBe(true);
    });
});
