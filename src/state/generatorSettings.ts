import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { storage } from './storage';

export const generatorTemperature = atomWithStorage<number>('generatorTemperature', 0.8, storage);
export const generatorTopK = atomWithStorage<number>('generatorTopK', 10, storage);
export const generatorTopP = atomWithStorage<number>('generatorTopP', 0.9, storage);
export const generatorMaxLength = atomWithStorage<number>('generatorMaxLength', 40000, storage);
export const generatorShowAttention = atomWithStorage<boolean>('generatorShowAttention', false, storage);
export const generatorAttentionBlock = atom<number>(5);
export const generatorAttentionHead = atom<number>(0);
export const generatorShowProbabilities = atom<boolean>(false);
export const generatorShowSettings = atom<boolean>(true);
export const generatorShowPrompt = atom<boolean>(true);
