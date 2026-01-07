import { atomWithStorage } from 'jotai/utils';
import { storage } from './storage';
import { atom } from 'jotai';
import { TeachableLLM } from '@genai-fi/nanogpt';

interface TrainingSettings {
    batchSize: number;
    maxSteps: number;
    learningRate: number;
    outputText: boolean;
    disableCheckpointing: boolean;
    gradientMetrics: boolean;
    mixedPrecision: boolean;
}
export const trainerSettings = atomWithStorage<TrainingSettings>(
    'trainerSettings',
    {
        batchSize: 16,
        maxSteps: 3000000,
        learningRate: 1e-3,
        outputText: true,
        disableCheckpointing: false,
        gradientMetrics: false,
        mixedPrecision: false,
    },
    storage
);

type Trainer = ReturnType<TeachableLLM['trainer']>;
export const trainerAtom = atom<Trainer | null>(null);
