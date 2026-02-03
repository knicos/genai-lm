import { atom } from 'jotai';
import Downloader from '../utilities/downloader';
import { Conversation } from '@genai-fi/nanogpt';

export interface DataEntry {
    id: string;
    name: string;
    content: string[];
    size: number;
    source: 'file' | 'input' | 'search';
}

export const dataEntries = atom<DataEntry[]>([]);

export const dataReady = atom<boolean>((get) => {
    const entries = get(dataEntries);
    return entries.length > 0;
});

export const datasetAtom = atom<string[]>([]);

export const downloadsAtom = atom<Downloader[]>([]);

export const dataTokens = atom<Uint16Array | null>(null);

export const dataTokensReady = atom<boolean>((get) => {
    const tokens = get(dataTokens);
    return tokens !== null && tokens.length > 0;
});

export const conversationDataAtom = atom<Conversation[][]>([]);
