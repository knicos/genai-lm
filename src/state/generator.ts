import { atomWithStorage } from 'jotai/utils';
import { storage } from './storage';
import { Generator } from '@genai-fi/nanogpt';
import { atom } from 'jotai';

export interface GeneratorSettings {
    temperature: number;
    topK: number;
    topP: number;
    maxLength: number;
    showAttention: boolean;
    attentionBlock: number;
    attentionHead: number;
    showProbabilities: boolean;
    showSettings: boolean;
}

export const generatorSettings = atomWithStorage<GeneratorSettings>(
    'generatorSettings',
    {
        temperature: 0.8,
        topK: 10,
        topP: 0.9,
        maxLength: 40000,
        showAttention: false,
        attentionBlock: 5,
        attentionHead: 0,
        showProbabilities: false,
        showSettings: true,
    },
    storage
);

export const generatorAtom = atom<Generator | null>(null);
