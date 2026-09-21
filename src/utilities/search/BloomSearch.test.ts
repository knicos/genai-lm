import { describe, it } from 'vitest';
import { tokenise } from '@genai-fi/nanogpt';
import BloomSearch from './BloomSearch';

describe('BloomSearch', () => {
    it('returns per-block ngram match counts and favors the best matching block', async ({ expect }) => {
        const store = new tokenise.TokenStore('tok', 'ds');
        try {
            // 3 blocks of 6 tokens each
            store.appendShard(new Uint16Array([1, 2, 3, 4, 9, 9, 9, 9, 1, 2, 3, 7]));

            const n = 3;
            const m = 2048;
            const k = 5;
            const blockSize = 4;
            const index = new BloomSearch(store, n, m, k, blockSize);

            const counts = await index.search([1, 2, 3, 4, 5]);

            expect(counts).toHaveLength(3);
            expect(counts[0]).toBeGreaterThanOrEqual(2);
            expect(counts[2]).toBeGreaterThanOrEqual(1);
            expect(counts[0]).toBeGreaterThan(counts[2]);
            expect(counts[0]).toBeGreaterThanOrEqual(counts[1]);
        } finally {
            await store.dispose();
        }
    });

    it('returns zero counts for all blocks when query is shorter than n', async ({ expect }) => {
        const store = new tokenise.TokenStore('tok', 'ds');
        try {
            store.appendShard(new Uint16Array([10, 11, 12, 13, 14, 15, 16, 17]));

            const index = new BloomSearch(store, 4, 512, 4, 4);
            const counts = await index.search([10, 11, 12]);

            expect(counts).toEqual([0, 0]);
        } finally {
            await store.dispose();
        }
    });

    it('handles a final partial block and still returns one count entry per block', async ({ expect }) => {
        const store = new tokenise.TokenStore('tok', 'ds');
        try {
            // 10 tokens with blockSize=4 -> 3 blocks (4, 4, 2)
            store.appendShard(new Uint16Array([3, 3, 4, 4, 7, 8, 9, 10, 7, 8]));

            const n = 2;
            const m = 1024;
            const k = 4;
            const index = new BloomSearch(store, n, m, k, 4);

            const counts = await index.search([7, 8, 9]);

            expect(counts).toHaveLength(3);
            expect(counts[1]).toBeGreaterThanOrEqual(2);
            expect(counts[2]).toBeGreaterThanOrEqual(1);
            expect(counts[1]).toBeGreaterThanOrEqual(counts[0]);
        } finally {
            await store.dispose();
        }
    });
});
