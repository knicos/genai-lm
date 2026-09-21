interface ScoredResult {
    score: number;
}

/**
 * Only stores N results based on score. Tracks the minimum score and a new item is dropped if it is lower than the current minimum and the buffer is full.
 */
export default class ResultBuffer<T extends ScoredResult> {
    private perfectResults: T[] = [];
    private otherResults: T[] = [];
    private maxSize: number;
    private minScore = -Infinity;
    private perfectScore: number;

    constructor(maxSize: number, perfectScore: number) {
        this.maxSize = maxSize;
        this.perfectScore = perfectScore;
    }

    public get perfectCount(): number {
        return this.perfectResults.length;
    }

    public get size(): number {
        return this.perfectResults.length + this.otherResults.length;
    }

    public add(item: T) {
        const maxSize = this.maxSize - this.perfectResults.length;
        if (item.score >= this.perfectScore) {
            this.perfectResults.push(item);
        } else if (this.otherResults.length < maxSize || item.score > this.minScore) {
            this.otherResults.push(item);
            this.otherResults.sort((a, b) => b.score - a.score);
            if (this.otherResults.length > maxSize) {
                this.otherResults.pop();
            }
            this.minScore = this.otherResults[this.otherResults.length - 1].score;
        }
    }

    public getAll(): T[] {
        return this.perfectResults.length >= this.maxSize
            ? this.perfectResults
            : [...this.perfectResults, ...this.otherResults];
    }

    public clear() {
        this.perfectResults = [];
        this.otherResults = [];
        this.minScore = -Infinity;
    }
}
