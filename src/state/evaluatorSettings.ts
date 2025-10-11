import { atomWithStorage } from 'jotai/utils';
import { storage } from './storage';

export type EvaluationMetric = 'loss' | 'accuracy' | 'perplexity' | 'quality';

export const evaluatorMetrics = atomWithStorage<EvaluationMetric>('evaluatorMetrics', 'quality', storage);

export const evaluatorAdvanced = atomWithStorage<boolean>('evaluatorAdvanced', false, storage);
