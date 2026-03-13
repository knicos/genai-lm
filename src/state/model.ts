import { GPTConfig, TeachableLLM } from '@genai-fi/nanogpt';
import { atom } from 'jotai';

export const modelAtom = atom<TeachableLLM | null>(null);

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

// TODO: Test this empircally.
// Units are millions.
export const modelSizeLimit = atom<number>(4);
