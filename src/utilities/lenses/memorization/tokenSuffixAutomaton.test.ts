import { describe, it } from 'vitest';
import { TokenSuffixAutomaton } from './tokenSuffixAutomaton';

describe('TokenSuffixAutomaton', () => {
    it('returns no match for an empty sequence', ({ expect }) => {
        const automaton = new TokenSuffixAutomaton([]);

        expect(automaton.next({ state: 0, length: 0 }, 1)).toEqual({ state: 0, length: 0 });
        expect(automaton.size).toBe(1);
        expect(automaton.firstEnd(0)).toBe(-1);
    });

    it('matches a complete sequence without changing the input state', ({ expect }) => {
        const automaton = new TokenSuffixAutomaton([0, 1, 2]);
        const initial = { state: 0, length: 0 };
        let match = initial;

        [0, 1, 2].forEach((token, index) => {
            match = automaton.next(match, token);
            expect(match.length).toBe(index + 1);
            expect(automaton.firstEnd(match.state)).toBe(index);
        });

        expect(initial).toEqual({ state: 0, length: 0 });
    });

    it('finds a match inside the indexed sequence', ({ expect }) => {
        const automaton = new TokenSuffixAutomaton([1, 2, 3, 4]);
        let match = automaton.next({ state: 0, length: 0 }, 2);
        match = automaton.next(match, 3);

        expect(match.length).toBe(2);
        expect(automaton.firstEnd(match.state)).toBe(2);
    });

    it('falls back to a matching suffix when a sequence cannot continue', ({ expect }) => {
        const automaton = new TokenSuffixAutomaton([1, 2, 3, 2, 4]);
        let match = { state: 0, length: 0 };

        [1, 2, 4].forEach((token) => {
            match = automaton.next(match, token);
        });

        expect(match.length).toBe(2);
        expect(automaton.firstEnd(match.state)).toBe(4);
    });

    it('resets on an unknown token and matches again afterwards', ({ expect }) => {
        const automaton = new TokenSuffixAutomaton([1, 2]);
        let match = automaton.next({ state: 0, length: 0 }, 1);
        match = automaton.next(match, 99);

        expect(match).toEqual({ state: 0, length: 0 });

        match = automaton.next(match, 2);
        expect(match.length).toBe(1);
        expect(automaton.firstEnd(match.state)).toBe(1);
    });

    it('handles overlapping repetitions without exceeding the indexed length', ({ expect }) => {
        const automaton = new TokenSuffixAutomaton([1, 1, 1]);
        let match = { state: 0, length: 0 };

        [1, 1, 1, 1, 1].forEach((token, index) => {
            match = automaton.next(match, token);
            expect(match.length).toBe(Math.min(index + 1, 3));
        });

        expect(automaton.firstEnd(match.state)).toBe(2);
    });

    it('agrees with a direct search for short sequences and their match positions', ({ expect }) => {
        const sequences: number[][] = [[]];
        for (let length = 1; length <= 4; length++) {
            for (let value = 0; value < 2 ** length; value++) {
                sequences.push(Array.from({ length }, (_, index) => (value >> index) & 1));
            }
        }

        sequences.forEach((tokens) => {
            const automaton = new TokenSuffixAutomaton(tokens);
            sequences.forEach((source) => {
                let match = { state: 0, length: 0 };
                source.forEach((token, index) => {
                    match = automaton.next(match, token);
                    let expectedLength = 0;
                    let expectedEnd = -1;

                    for (let length = 1; length <= Math.min(index + 1, tokens.length); length++) {
                        const suffix = source.slice(index + 1 - length, index + 1);
                        const start = tokens.findIndex((_, offset) =>
                            suffix.every((value, position) => tokens[offset + position] === value)
                        );
                        if (start >= 0) {
                            expectedLength = length;
                            expectedEnd = start + length - 1;
                        }
                    }

                    expect(match.length).toBe(expectedLength);
                    expect(automaton.firstEnd(match.state)).toBe(expectedEnd);
                });
            });
        });
    });
});
