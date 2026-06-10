import { GPTConfig, TeachableLLM } from '@genai-fi/nanogpt';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { observe } from 'jotai-effect';
import { store } from './store';
import Downloader from '../utilities/downloader';

export const modelDownloadAtom = atom<Downloader | null>(null);

export const modelAtom = atom<TeachableLLM | null>(null);

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
