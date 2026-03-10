import { atomWithStorage } from 'jotai/utils';
import { storage } from './storage';

export type EvaluationMetric = 'loss' | 'accuracy' | 'perplexity' | 'gradientNorm';

export const evaluatorMetrics = atomWithStorage<EvaluationMetric>('evaluatorMetrics', 'accuracy', storage);

export const evaluatorAdvanced = atomWithStorage<boolean>('evaluatorAdvanced', false, storage);
