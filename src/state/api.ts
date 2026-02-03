import { atomWithStorage } from 'jotai/utils';
import { storage } from './storage';

export interface ApiSettings {
    endpoint?: string;
    apiKey?: string;
    modelName?: string;
}

export const apiSettingsAtom = atomWithStorage<ApiSettings>(
    'apiSettings',
    {
        endpoint: 'http://localhost:1234',
        apiKey: undefined,
        modelName: 'google/gemma-3-1b',
    },
    storage
);
