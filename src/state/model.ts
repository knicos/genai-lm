import { TeachableLLM } from '@genai-fi/nanogpt';
import { atom } from 'jotai';

export const modelAtom = atom<TeachableLLM | null>(null);
