import { atomWithStorage } from 'jotai/utils';
import { storage } from './storage';
import { atom } from 'jotai';
import { TeachableLLM, TrainingOptions } from '@genai-fi/nanogpt';

interface TrainingSettings extends TrainingOptions {
    outputText: boolean;
    disableCheckpointing: boolean;
}
export const trainerSettings = atomWithStorage<TrainingSettings>(
    'trainerSettings',
    {
        batchSize: 16,
        maxEpochs: 1000,
        learningRate: 1e-3,
        outputText: true,
        disableCheckpointing: false,
        mixedPrecision: true,
        warmupSteps: 100,
        decayEpochs: 100,
        weightDecay: 0.01,
        sftMode: 'full',
        logInterval: 20,
        metrics: ['perplexity', 'gradientNorm', 'memoryUsage', 'accuracy'],
        orthoGrad: false,
        dropout: 0.0,
        layerDrop: 0.0,
        labelSmoothing: 0.0,
    },
    storage
);

type Trainer = ReturnType<TeachableLLM['trainer']>;
export const trainerAtom = atom<Trainer | null>(null);

export const tunerSettings = atomWithStorage<TrainingSettings>(
    'tunerSettings',
    {
        batchSize: 16,
        maxEpochs: 1000,
        learningRate: 1e-4,
        outputText: true,
        disableCheckpointing: false,
        mixedPrecision: true,
        loraConfig: {
            rank: 4,
            alpha: 8,
            variables: ['*'],
        },
        sftMode: 'full',
        warmupSteps: 10,
        decayEpochs: 1,
        weightDecay: 0.0,
        logInterval: 20,
        metrics: ['perplexity', 'gradientNorm', 'memoryUsage', 'accuracy'],
        orthoGrad: false,
    },
    storage
);

export const tunerAtom = atom<Trainer | null>(null);
