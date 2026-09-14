interface SuffixNode {
    transitions: Map<number, number>;
    link: number;
    length: number;
    firstEnd: number;
}

export interface SuffixMatchState {
    state: number;
    length: number;
}

export class TokenSuffixAutomaton {
    private readonly nodes: SuffixNode[] = [{ transitions: new Map(), link: -1, length: 0, firstEnd: -1 }];
    private last = 0;

    constructor(tokens: readonly number[]) {
        tokens.forEach((token, index) => this.extend(token, index));
    }

    next(match: SuffixMatchState, token: number): SuffixMatchState {
        let { state, length } = match;

        while (state !== 0 && !this.nodes[state].transitions.has(token)) {
            state = this.nodes[state].link;
            length = Math.min(length, this.nodes[state].length);
        }

        const nextState = this.nodes[state].transitions.get(token);
        if (nextState === undefined) {
            return { state: 0, length: 0 };
        }
        return { state: nextState, length: length + 1 };
    }

    firstEnd(state: number) {
        return this.nodes[state].firstEnd;
    }

    get size() {
        return this.nodes.length;
    }

    private extend(token: number, end: number) {
        const current = this.nodes.length;
        this.nodes.push({
            transitions: new Map(),
            link: 0,
            length: this.nodes[this.last].length + 1,
            firstEnd: end,
        });

        let previous = this.last;
        while (previous !== -1 && !this.nodes[previous].transitions.has(token)) {
            this.nodes[previous].transitions.set(token, current);
            previous = this.nodes[previous].link;
        }

        if (previous === -1) {
            this.nodes[current].link = 0;
            this.last = current;
            return;
        }

        const next = this.nodes[previous].transitions.get(token);
        if (next === undefined) {
            throw new Error('Suffix automaton transition is missing');
        }

        if (this.nodes[previous].length + 1 === this.nodes[next].length) {
            this.nodes[current].link = next;
            this.last = current;
            return;
        }

        const clone = this.nodes.length;
        this.nodes.push({
            transitions: new Map(this.nodes[next].transitions),
            link: this.nodes[next].link,
            length: this.nodes[previous].length + 1,
            firstEnd: this.nodes[next].firstEnd,
        });

        while (previous !== -1 && this.nodes[previous].transitions.get(token) === next) {
            this.nodes[previous].transitions.set(token, clone);
            previous = this.nodes[previous].link;
        }

        this.nodes[next].link = clone;
        this.nodes[current].link = clone;
        this.last = current;
    }
}
