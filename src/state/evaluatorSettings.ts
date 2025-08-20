import { atom } from 'jotai';

export type EvaluationMetric = 'loss' | 'accuracy' | 'perplexity' | 'quality';

export const evaluatorMetrics = atom<EvaluationMetric>('quality');
