import { atomWithStorage } from 'jotai/utils';
import { storage } from './storage';

export const trainerBatchSize = atomWithStorage<number>('trainerBatchSize', 32, storage);
export const trainerMaxSteps = atomWithStorage<number>('trainerMaxSteps', 3000000, storage);
export const trainerLearningRate = atomWithStorage<number>('trainerLearningRate', 1e-3, storage);
export const trainerOutputText = atomWithStorage<boolean>('trainerOutputText', true, storage);
export const trainerCheckpointing = atomWithStorage<boolean>('trainerCheckpointing', false, storage);
