import { atom } from 'jotai';

export const trainerBatchSize = atom<number>(32);
export const trainerMaxSteps = atom<number>(30000);
export const trainerLearningRate = atom<number>(1e-3);
export const trainerOutputText = atom<boolean>(true);
export const trainerCheckpointing = atom<boolean>(false);
