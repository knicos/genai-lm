import { atom } from 'jotai';

export const generatorTemperature = atom<number>(1.0);
export const generatorTopK = atom<number>(10);
export const generatorMaxLength = atom<number>(400);
export const generatorShowAttention = atom<boolean>(false);
export const generatorShowProbabilities = atom<boolean>(false);
export const generatorShowSettings = atom<boolean>(true);
export const generatorShowPrompt = atom<boolean>(true);
