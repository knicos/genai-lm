import { atom } from 'jotai';

export const generatorTemperature = atom<number>(0.8);
export const generatorTopK = atom<number>(10);
export const generatorTopP = atom<number>(0.9);
export const generatorMaxLength = atom<number>(40000);
export const generatorShowAttention = atom<boolean>(false);
export const generatorAttentionBlock = atom<number>(5);
export const generatorAttentionHead = atom<number>(0);
export const generatorShowProbabilities = atom<boolean>(false);
export const generatorShowSettings = atom<boolean>(true);
export const generatorShowPrompt = atom<boolean>(true);
