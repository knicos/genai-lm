import { atomWithStorage } from 'jotai/utils';
import { storage } from './storage';
import { atom } from 'jotai';
import { TeachableLLM, TrainingOptions } from '@genai-fi/nanogpt';
import { observe } from 'jotai-effect';
import { modelAtom } from './model';
import { store } from './store';

interface TrainingSettings extends TrainingOptions {
    outputText: boolean;
    disableCheckpointing: boolean;
}
export const trainerSettings = atomWithStorage<TrainingSettings>(
    'trainerSettings',
    {
        batchSize: 16,
        maxEpochs: 10,
        learningRate: 1e-3,
        outputText: true,
        disableCheckpointing: false,
        mixedPrecision: true,
        warmupSteps: 100,
        decayEpochs: 2,
        weightDecay: 0.01,
        sftMode: 'full',
        logInterval: 40,
        metrics: ['perplexity', 'gradientNorm', 'memoryUsage', 'accuracy'],
        orthoGrad: false,
        dropout: 0.1,
        layerDrop: 0.0,
        labelSmoothing: 0.0,
    },
    storage
);

type Trainer = ReturnType<TeachableLLM['trainer']>;
export const trainerAtom = atom<Trainer | null>(null);

// Make sure trainer matches model
observe((get, set) => {
    const model = get(modelAtom);
    if (model) {
        const h = () => {
            const currentTrainer = model.currentTrainer;
            set(trainerAtom, currentTrainer);

            if (model.meta.pretrainingSettings) {
                set(trainerSettings, (prev) => ({
                    ...prev,
                    ...model.meta.pretrainingSettings,
                }));
            }
        };
        model.on('loaded', h);
        return () => {
            model.off('loaded', h);
        };
    }
}, store);

export const tunerSettings = atomWithStorage<TrainingSettings>(
    'tunerSettings',
    {
        batchSize: 8,
        maxEpochs: 5,
        learningRate: 1e-3,
        outputText: true,
        disableCheckpointing: false,
        mixedPrecision: true,
        loraConfig: {
            rank: 4,
            alpha: 8,
            variables: ['*'],
        },
        sftMode: 'lora',
        warmupSteps: 10,
        decayEpochs: 1,
        weightDecay: 0.01,
        dropout: 0.1,
        layerDrop: 0.0,
        labelSmoothing: 0.0,
        logInterval: 40,
        metrics: ['perplexity', 'gradientNorm', 'memoryUsage', 'accuracy'],
        orthoGrad: false,
        clipNorm: 1.0,
        maskedLoss: true,
        debug: false,
    },
    storage
);

export const tunerAtom = atom<Trainer | null>(null);

// Make sure tuner resets on LoRA change
observe((get, set) => {
    const model = get(modelAtom);
    if (model) {
        const h = () => {
            set(tunerAtom, null);
        };
        model.on('changeLoRA', h);
        return () => {
            model.off('changeLoRA', h);
        };
    }
}, store);
