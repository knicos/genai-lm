import { atomWithStorage } from 'jotai/utils';
import { storage } from './storage';
import { atom } from 'jotai';
import { ITrainerOptions, TeachableLLM } from '@genai-fi/nanogpt';

interface TrainingSettings extends ITrainerOptions {
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
        mixedPrecision: true,
    },
    storage
);

type Trainer = ReturnType<TeachableLLM['trainer']>;
export const trainerAtom = atom<Trainer | null>(null);

export const tunerSettings = atomWithStorage<TrainingSettings>(
    'tunerSettings',
    {
        batchSize: 2,
        maxSteps: 3000000,
        learningRate: 1e-4,
        outputText: true,
        disableCheckpointing: false,
        gradientMetrics: false,
        mixedPrecision: true,
        loraConfig: {
            rank: 4,
            alpha: 8,
            variables: ['*'],
        },
        sftMode: 'last-layer',
    },
    storage
);

export const tunerAtom = atom<Trainer | null>(null);
