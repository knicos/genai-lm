import { GPTConfig, TeachableLLM } from '@genai-fi/nanogpt';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { observe } from 'jotai-effect';
import { store } from './store';
import Downloader from '../utilities/downloader';
import logger from '../utilities/logger';
import { uiDeveloperMode } from './uiState';

export interface ModelManifestEntry {
    id: string;
    title: string;
    url?: string;
    language: string;
    conversational: boolean;
    trained: boolean;
    restricted: boolean;
    size: number;
    rating: number;
    sampleContent?: string;
    tags: string[];
    config?: GPTConfig;
}

interface ModelManifest {
    models: ModelManifestEntry[];
}

export const modelManifestLanguage = atom<string>('en');

function groupByTag(models: ModelManifestEntry[], restricted = false) {
    const tags = new Map<string, ModelManifestEntry[]>();
    models.forEach((entry) => {
        if (entry.restricted && !restricted) {
            return;
        }
        entry.tags.forEach((tag) => {
            if (!tags.has(tag)) {
                tags.set(tag, []);
            }
            tags.get(tag)?.push(entry);
        });
    });
    return Array.from(tags.entries()).map(([name, datasets]) => ({
        title: name,
        cards: datasets,
    }));
}

export const trainedModelManifest = atom(async (get) => {
    const lang = get(modelManifestLanguage);
    const isDev = get(uiDeveloperMode);
    const response = await fetch(`${import.meta.env.VITE_APP_API}/models?lang=${lang}&trained=true`);
    const model: ModelManifest = await response.json();

    return groupByTag(model.models, isDev);
});

export const untrainedModelManifest = atom(async (get) => {
    const lang = get(modelManifestLanguage);
    const isDev = get(uiDeveloperMode);
    const response = await fetch(`${import.meta.env.VITE_APP_API}/models?lang=${lang}&trained=false`);
    const model: ModelManifest = await response.json();

    return groupByTag(model.models, isDev);
});

export const modelDownloadAtom = atom<Downloader | null>(null);

export const modelAtom = atom<TeachableLLM | null>(null);

observe((get, set) => {
    const downloader = get(modelDownloadAtom);
    if (downloader) {
        const onEnd = (file: File) => {
            set(modelDownloadAtom, null);
            const newModel = TeachableLLM.loadModel(file, { sourceURL: downloader.url });
            set(modelAtom, (old) => {
                if (old) {
                    old.dispose();
                }
                return newModel;
            });
        };
        const onCancel = () => {
            set(modelDownloadAtom, null);
        };
        downloader.on('end', onEnd);
        downloader.on('cancel', onCancel);
        return () => {
            downloader.off('end', onEnd);
            downloader.off('cancel', onCancel);
        };
    }
}, store);

export const loadedModelAtom = atom<TeachableLLM | null>(null);

export type ExtendedConfig = GPTConfig & {
    id?: string;
    tokenizer?: 'char' | 'bpe';
};

export const modelConfigAtom = atom<ExtendedConfig>({
    id: 'untrained-small',
    tokenizer: 'char',
    vocabSize: 200,
    nEmbed: 192,
    nHead: 3,
    nLayer: 4,
    mlpFactor: 4,
    modelType: 'GenAI_NanoGPT_v2',
    blockSize: 128,
});

// Ensure config matches the model.
observe((get, set) => {
    const model = get(modelAtom);
    if (model) {
        const h = () => {
            const config = model.config;
            set(modelConfigAtom, {
                id: model.meta.id,
                tokenizer: model.tokeniser.vocabSize <= 256 ? 'char' : 'bpe',
                ...config,
            });
            set(loadedModelAtom, model);

            logger.log({
                action: 'model_loaded',
                name: model.meta.name,
                id: model.meta.id,
                params: model.getNumParams(),
            });
        };
        model.on('loaded', h);
        return () => {
            model.off('loaded', h);
        };
    } else {
        set(loadedModelAtom, null);
    }
}, store);

// TODO: Test this empircally.
// Units are millions.
export const modelSizeLimit = atom<number>(4);

export const modelReady = atom<boolean>((get) => {
    const model = get(modelAtom);
    return model !== null;
});

export const modelLoRAName = atom<string | null>(null);

export const modelSaveCheckpoints = atomWithStorage<boolean>('modelSaveCheckpoints', true);
