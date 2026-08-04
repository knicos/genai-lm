import { describe, it } from 'vitest';
import { reduceAttention } from './attention';

describe('reduceAttention', () => {
    it('reduces heads by max and normalises values', ({ expect }) => {
        const input = [[[[1, 2, 3]], [[2, 1, 6]]]];

        const reduced = reduceAttention(input);

        expect(reduced).toHaveLength(1);
        expect(reduced[0][0]).toBeCloseTo(2 / 6);
        expect(reduced[0][1]).toBeCloseTo(2 / 6);
        expect(reduced[0][2]).toBe(1);
    });
});
