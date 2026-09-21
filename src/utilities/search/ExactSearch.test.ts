import { describe, it } from 'vitest';
import { tokenise } from '@genai-fi/nanogpt';
import NGramSearch from './ExactSearch';

describe('NGramSearch', () => {
    it('returns the longest exact matches ranked first', async ({ expect }) => {
        const store = new tokenise.TokenStore('tok', 'ds');

        try {
            // Place a full query match near the middle and a weaker partial region later.
            store.appendShard(
                new Uint16Array([9, 9, 9, 9, 9, 9, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3, 99, 99, 99])
            );

            const search = new NGramSearch(store, 3);
            const resultInfo = await search.search([1, 2, 3, 4, 5, 6]);
            const result = resultInfo.results;

            expect(result.length).toBeGreaterThan(0);
            expect(result[0].position).toBe(6);
            expect(result[0].queryPosition).toBe(0);
            expect(result[0].matchLength).toBeGreaterThanOrEqual(6);
            expect(result[0].blockIndex).toBe(0);
            expect(result.some((entry) => entry.position === 18)).toBe(true);
        } finally {
            await store.dispose();
        }
    });

    it('returns empty results when query is shorter than n', async ({ expect }) => {
        const store = new tokenise.TokenStore('tok', 'ds');

        try {
            store.appendShard(new Uint16Array([1, 2, 3, 4, 5]));
            const search = new NGramSearch(store, 4);
            const result = await search.search([1, 2, 3]);
            expect(result).toEqual({
                approximate: false,
                estimatedMatches: 0,
                exactMatches: 0,
                results: [],
            });
        } finally {
            await store.dispose();
        }
    });

    it('does not emit duplicate candidate positions on repetitive matches', async ({ expect }) => {
        const store = new tokenise.TokenStore('tok', 'ds');

        try {
            store.appendShard(new Uint16Array([1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3, 9, 9, 9, 9]));

            const search = new NGramSearch(store, 3);
            const resultInfo = await search.search([1, 2, 3, 1, 2, 3, 1, 2, 3]);
            const result = resultInfo.results;
            const positions = result.map((entry) => entry.position);
            const unique = new Set(positions);

            expect(result.length).toBeGreaterThan(0);
            expect(unique.size).toBe(positions.length);
        } finally {
            await store.dispose();
        }
    });
});
