import { describe, it } from 'vitest';
import filterTokens from './filterTokens';

describe('filterTokens', () => {
    it('filters tiny probabilities and computes cumulative ranges', ({ expect }) => {
        const filtered = filterTokens(['a', 'b', 'c'], [0.9, 0.00001, 0.1]);

        expect(filtered).toHaveLength(2);
        expect(filtered[0]).toMatchObject({ token: 0, text: 'a', start: 0, end: 0.9 });
        expect(filtered[1]).toMatchObject({ token: 2, text: 'c', start: 0.9, end: 1.0 });
    });
});
