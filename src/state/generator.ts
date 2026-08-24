import { atomWithStorage } from 'jotai/utils';
import { storage } from './storage';
import { observe } from 'jotai-effect';
import { store } from './store';
import { loadedModelAtom } from './model';
import type { GeneratorConversation, IGenerateOptions } from '@genai-fi/nanogpt';
import { atom } from 'jotai';

export interface GeneratorSettings extends IGenerateOptions {
    highlightMode: 'none' | 'confidence' | 'probability' | 'attention';
    promptMode: 'none' | 'completion' | 'conversation';
}

export interface ExtendedGeneratorConversation extends GeneratorConversation {
    _trainingOutput?: boolean;
    _step?: number;
    _timestamp?: number;
}

export const generatorSettings = atomWithStorage<GeneratorSettings>(
    'generatorSettings',
    {
        temperature: 0.8,
        topK: 10,
        topP: 0.9,
        maxLength: 40000,
        outputConfidence: true,
        promptMode: 'completion',
        highlightMode: 'none',
    },
    storage
);

export const chatSettings = atomWithStorage<GeneratorSettings>(
    'chatSettings',
    {
        temperature: 0.8,
        topK: 10,
        topP: 0.9,
        maxLength: 40000,
        promptMode: 'conversation',
        highlightMode: 'none',
    },
    storage
);

export const rawGeneratedTextAtom = atom<ExtendedGeneratorConversation[]>([]);
export const rawGenerationIDAtom = atom<string | null>(null);
export const conversationGeneratedAtom = atom<GeneratorConversation[]>([]);
export const conversationIDAtom = atom<string | null>(null);

observe((get, set) => {
    const model = get(loadedModelAtom);
    if (model) {
        const modeChange = () => {
            const newMode = model.mode;
            set(generatorSettings, (old) => ({
                ...old,
                promptMode: (newMode === 'conversational'
                    ? 'conversation'
                    : old.promptMode === 'none'
                      ? 'none'
                      : 'completion') as 'none' | 'completion' | 'conversation',
            }));
        };
        model.on('mode', modeChange);
        modeChange();

        return () => {
            model.off('mode', modeChange);
        };
    }
}, store);
