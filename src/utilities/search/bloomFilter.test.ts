import { describe, it } from 'vitest';
import { createNGramBloom, hasNGramMembership } from './bloomFilter';

describe('NGram Bloom', () => {
    it('should correctly create and check NGram Bloom membership', ({ expect }) => {
        const tokens = new Uint16Array([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        const n = 3;
        const m = 32;
        const k = 3;

        const bloom = createNGramBloom(tokens, n, m, k);

        for (let start = 0; start <= tokens.length - n; start++) {
            const ngram = tokens.subarray(start, start + n);
            expect(hasNGramMembership(bloom, ngram, m, k)).toBe(true);
        }

        const nonMember = new Uint16Array([6, 4, 2]);
        expect(hasNGramMembership(bloom, nonMember, m, k)).toBe(false);
    });

    it('should report membership for repeated overlapping patterns', ({ expect }) => {
        const tokens = new Uint16Array([4, 4, 4, 2, 4, 4, 4, 2, 4, 4, 4]);
        const n = 3;
        const m = 128;
        const k = 4;

        const bloom = createNGramBloom(tokens, n, m, k);

        expect(hasNGramMembership(bloom, new Uint16Array([4, 4, 4]), m, k)).toBe(true);
        expect(hasNGramMembership(bloom, new Uint16Array([4, 4, 2]), m, k)).toBe(true);
        expect(hasNGramMembership(bloom, new Uint16Array([2, 4, 4]), m, k)).toBe(true);

        expect(hasNGramMembership(bloom, new Uint16Array([2, 2, 2]), m, k)).toBe(false);
    });

    it('should support unigram bloom membership (n=1)', ({ expect }) => {
        const tokens = new Uint16Array([10, 20, 30, 20, 10]);
        const n = 1;
        const m = 64;
        const k = 3;

        const bloom = createNGramBloom(tokens, n, m, k);

        expect(hasNGramMembership(bloom, new Uint16Array([10]), m, k)).toBe(true);
        expect(hasNGramMembership(bloom, new Uint16Array([20]), m, k)).toBe(true);
        expect(hasNGramMembership(bloom, new Uint16Array([30]), m, k)).toBe(true);
        expect(hasNGramMembership(bloom, new Uint16Array([99]), m, k)).toBe(false);
    });

    it('should return an empty filter when token length is smaller than n', ({ expect }) => {
        const tokens = new Uint16Array([1, 2]);
        const n = 3;
        const m = 40;
        const k = 2;

        const bloom = createNGramBloom(tokens, n, m, k);

        expect(bloom.length).toBe(Math.ceil(m / 8));
        expect(Array.from(bloom)).toEqual(new Array(Math.ceil(m / 8)).fill(0));
        expect(hasNGramMembership(bloom, new Uint16Array([1, 2, 3]), m, k)).toBe(false);
    });

    it('should return false when query ngram length does not match n', ({ expect }) => {
        const tokens = new Uint16Array([1, 2, 3, 4]);
        const n = 2;
        const m = 48;
        const k = 2;

        const bloom = createNGramBloom(tokens, n, m, k);

        expect(hasNGramMembership(bloom, new Uint16Array([1]), m, k)).toBe(false);
        expect(hasNGramMembership(bloom, new Uint16Array([1, 2, 3]), m, k)).toBe(false);
    });
});
