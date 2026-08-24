import { atomWithStorage } from 'jotai/utils';
import { storage } from './storage';
import { atom } from 'jotai';
import { TrainingOptions } from '@genai-fi/nanogpt';
import { observe } from 'jotai-effect';
import { modelAtom } from './model';
import { store } from './store';
// import { dataTokens } from './data';

export interface TrainingSettings extends TrainingOptions {
    outputText: boolean;
    disableCheckpointing: boolean;
    limitLayers?: number;
}
export const trainerSettings = atomWithStorage<TrainingSettings>(
    'trainerSettings',
    {
        method: { type: 'pretraining' },
        batchSize: 16,
        maxEpochs: 2,
        learningRate: 1e-3,
        minLearningRate: 1e-4,
        outputText: true,
        disableCheckpointing: false,
        mixedPrecision: true,
        warmupSteps: 100,
        decayEpochs: 2,
        weightDecay: 0.1,
        logInterval: 40,
        metrics: ['perplexity', 'gradientNorm', 'memoryUsage', 'accuracy'],
        orthoGrad: false,
        dropout: 0.1,
        layerDrop: 0.0,
        labelSmoothing: 0.0,
    },
    storage
);

export const pftSettings = atomWithStorage<TrainingSettings>(
    'pftSettings',
    {
        method: { type: 'pretraining' },
        batchSize: 16,
        maxEpochs: 1,
        learningRate: 1e-4,
        minLearningRate: 1e-4,
        outputText: false,
        disableCheckpointing: false,
        mixedPrecision: true,
        warmupSteps: 100,
        decayEpochs: 1,
        weightDecay: 0.1,
        logInterval: 40,
        metrics: ['perplexity', 'gradientNorm', 'memoryUsage', 'accuracy'],
        orthoGrad: false,
        dropout: 0.1,
        layerDrop: 0.0,
        labelSmoothing: 0.0,
        limitLayers: 2,
    },
    storage
);

export const trainingModeAtom = atom<'pretrain' | 'partial' | 'lora'>('pretrain');
export const trainerJobIdAtom = atom<string | null>(null);

// Make sure trainer matches model
observe((get, set) => {
    const model = get(modelAtom);
    if (model) {
        console.warn('Clearing trainer job ID');
        set(trainerJobIdAtom, null);

        const h = () => {
            const job = model.training.getPretrainingJob();
            if (job) {
                set(trainerJobIdAtom, job.id);
            } else {
                console.warn('Clearing trainer job ID');
                set(trainerJobIdAtom, null);
            }
        };
        model.on('loaded', h);

        return () => {
            model.off('loaded', h);
        };
    }
}, store);

// Make sure the trainer resets if dataset changes
/*observe((get, set) => {
    const dataset = get(dataTokens);
    const model = get(modelAtom);
    const id = get(trainerJobIdAtom);
    if (model && id && dataset) {
        const job = model.training.getJob(id);
        if (job && job.datasetId && job.datasetId !== dataset.datasetId) {
            console.warn('Clearing trainer job ID', job.datasetId, dataset.datasetId);
            set(trainerJobIdAtom, null);
        }
    }
}, store);*/

export const tunerSettings = atomWithStorage<TrainingSettings>(
    'tunerSettings',
    {
        method: { type: 'supervised', supervised: 'lora' },
        batchSize: 8,
        maxEpochs: 2,
        learningRate: 1e-3,
        outputText: false,
        disableCheckpointing: false,
        mixedPrecision: true,
        loraConfig: {
            rank: 4,
            alpha: 8,
            variables: ['*'],
        },
        warmupSteps: 100,
        decayEpochs: 1,
        weightDecay: 0.1,
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

export const tunerJobIdAtom = atom<string | null>(null);

// Make sure tuner resets on LoRA change
observe((get, set) => {
    const model = get(modelAtom);
    if (model) {
        const h = () => {
            set(tunerJobIdAtom, null);
        };
        model.on('changeLoRA', h);
        return () => {
            model.off('changeLoRA', h);
        };
    }
}, store);
