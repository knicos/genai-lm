export interface CollapsedTrainingPoint {
    step: number;
    trainingLoss: number;
    validationLoss: number;
    trainingPerplexity?: number;
    validationPerplexity?: number;
    trainingAccuracy?: number;
    validationAccuracy?: number;
    gradientNorm?: number;
    /** number of source items represented by this point */
    count: number;
}

interface Bucket {
    count: number;
    trainLossSum: number;
    valLossSum: number;
    trainPerplexitySum: number;
    valPerplexitySum: number;
    trainAccuracySum: number;
    valAccuracySum: number;
    gradientNormSum: number;
    lastStep: number;
}

export class CollapsedTrainingLog {
    // private readonly raw: CollapsedTrainingPoint[] = [];
    private groupSize: number;
    private collapsed: CollapsedTrainingPoint[] = [];
    private active: Bucket | null = null;

    constructor(groupSize = 10, initialLog?: CollapsedTrainingPoint[]) {
        this.groupSize = this.validateGroupSize(groupSize);
        if (initialLog) {
            this.pushMany(initialLog);
        }
    }

    public setGroupSize(nextGroupSize: number): void {
        const normalized = this.validateGroupSize(nextGroupSize);
        if (normalized === this.groupSize) return;

        // Fast path: only when doubling (as per your assumption).
        if (normalized === this.groupSize * 2) {
            this.rebuildByDoubling();
            this.groupSize = normalized;
            return;
        }

        this.groupSize = normalized;
        // this.rebuild();
        throw new Error('Changing group size to non-double values is not supported in this implementation.');
    }

    public getGroupSize(): number {
        return this.groupSize;
    }

    public push(entry: CollapsedTrainingPoint): CollapsedTrainingPoint[] {
        // this.raw.push(entry);
        this.addToBuckets(entry);
        return this.getCollapsed();
    }

    public pushMany(entries: CollapsedTrainingPoint[]): CollapsedTrainingPoint[] {
        for (const e of entries) {
            // this.raw.push(e);
            this.addToBuckets(e);
        }
        return this.getCollapsed();
    }

    /**
     * Returns a new array every time.
     * includePartial=true includes the currently filling bucket (averaged so far).
     */
    public getCollapsed(includePartial = true): CollapsedTrainingPoint[] {
        const out = [...this.collapsed];
        if (includePartial && this.active && this.active.count > 0) {
            out.push(this.toPoint(this.active));
        }
        return out;
    }

    public clear(): void {
        // this.raw.length = 0;
        this.collapsed = [];
        this.active = null;
    }

    /*private rebuild(): void {
        this.collapsed = [];
        this.active = null;
        for (const entry of this.raw) {
            this.addToBuckets(entry);
        }
    }*/

    private addToBuckets(entry: CollapsedTrainingPoint): void {
        if (!this.active) {
            this.active = {
                count: 0,
                trainLossSum: 0,
                valLossSum: 0,
                trainPerplexitySum: 0,
                valPerplexitySum: 0,
                trainAccuracySum: 0,
                valAccuracySum: 0,
                gradientNormSum: 0,
                lastStep: entry.step ?? 0,
            };
        }

        this.active.count += 1;
        this.active.trainLossSum += entry.trainingLoss ?? 0;
        this.active.valLossSum += entry.validationLoss ?? 0;
        this.active.trainPerplexitySum += entry.trainingPerplexity ?? 0;
        this.active.valPerplexitySum += entry.validationPerplexity ?? 0;
        this.active.trainAccuracySum += entry.trainingAccuracy ?? 0;
        this.active.valAccuracySum += entry.validationAccuracy ?? 0;
        this.active.gradientNormSum += entry.gradientNorm ?? 0;
        this.active.lastStep = entry.step ?? 0;

        if (this.active.count >= this.groupSize) {
            this.collapsed.push(this.toPoint(this.active));
            this.active = null;
        }
    }

    private rebuildByDoubling(): void {
        // old group size = g, new group size = 2g
        const nextCollapsed: CollapsedTrainingPoint[] = [];
        let carry: Bucket | null = null;

        // Merge pairs of already-collapsed full buckets.
        for (const p of this.collapsed) {
            const b = this.pointToBucket(p);

            if (!carry) {
                carry = b;
            } else {
                nextCollapsed.push(this.toPoint(this.mergeBuckets(carry, b)));
                carry = null;
            }
        }

        // Remaining carry and old partial bucket become new partial bucket.
        let nextActive: Bucket | null = null;

        if (carry && this.active) {
            // count is always < newGroupSize because:
            // carry.count === oldGroupSize, active.count < oldGroupSize
            nextActive = this.mergeBuckets(carry, this.cloneBucket(this.active));
        } else if (carry) {
            nextActive = carry;
        } else if (this.active) {
            nextActive = this.cloneBucket(this.active);
        }

        this.collapsed = nextCollapsed;
        this.active = nextActive;
    }

    private pointToBucket(p: CollapsedTrainingPoint): Bucket {
        return {
            count: p.count,
            trainLossSum: p.trainingLoss * p.count,
            valLossSum: p.validationLoss * p.count,
            trainPerplexitySum: (p.trainingPerplexity ?? 0) * p.count,
            valPerplexitySum: (p.validationPerplexity ?? 0) * p.count,
            trainAccuracySum: (p.trainingAccuracy ?? 0) * p.count,
            valAccuracySum: (p.validationAccuracy ?? 0) * p.count,
            gradientNormSum: (p.gradientNorm ?? 0) * p.count,
            lastStep: p.step,
        };
    }

    private mergeBuckets(a: Bucket, b: Bucket): Bucket {
        return {
            count: a.count + b.count,
            trainLossSum: a.trainLossSum + b.trainLossSum,
            valLossSum: a.valLossSum + b.valLossSum,
            trainPerplexitySum: a.trainPerplexitySum + b.trainPerplexitySum,
            valPerplexitySum: a.valPerplexitySum + b.valPerplexitySum,
            trainAccuracySum: a.trainAccuracySum + b.trainAccuracySum,
            valAccuracySum: a.valAccuracySum + b.valAccuracySum,
            gradientNormSum: a.gradientNormSum + b.gradientNormSum,
            lastStep: b.lastStep, // latest step in merged bucket
        };
    }

    private cloneBucket(b: Bucket): Bucket {
        return {
            count: b.count,
            trainLossSum: b.trainLossSum,
            valLossSum: b.valLossSum,
            trainPerplexitySum: b.trainPerplexitySum,
            valPerplexitySum: b.valPerplexitySum,
            trainAccuracySum: b.trainAccuracySum,
            valAccuracySum: b.valAccuracySum,
            gradientNormSum: b.gradientNormSum,
            lastStep: b.lastStep,
        };
    }

    private toPoint(bucket: Bucket): CollapsedTrainingPoint {
        return {
            step: bucket.lastStep, // keep x-axis monotonic and aligned to latest source step in bucket
            trainingLoss: bucket.trainLossSum / bucket.count,
            validationLoss: bucket.valLossSum / bucket.count,
            trainingPerplexity: bucket.trainPerplexitySum / bucket.count,
            validationPerplexity: bucket.valPerplexitySum / bucket.count,
            trainingAccuracy: bucket.trainAccuracySum / bucket.count,
            validationAccuracy: bucket.valAccuracySum / bucket.count,
            gradientNorm: bucket.gradientNormSum / bucket.count,
            count: bucket.count,
        };
    }

    private validateGroupSize(n: number): number {
        if (!Number.isFinite(n) || n < 1) return 1;
        return Math.floor(n);
    }
}
