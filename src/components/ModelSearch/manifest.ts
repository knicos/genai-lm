import { GPTConfig } from '@genai-fi/nanogpt';
import { ModelCardItem } from '../ModelCard/type';

const IGNORE_KEYS = new Set<keyof GPTConfig>(['dropout', 'blockSize']);

export interface ModelManifest {
    models: ModelCardItem[];
    categories: Record<string, { name: string; modelIds: string[] }[]>;
    languages: Record<string, string>;
}

export function configMatch(configA: Partial<GPTConfig>, configB: GPTConfig): boolean {
    const keysA = Object.keys(configA) as (keyof GPTConfig)[];

    for (const key of keysA) {
        if (IGNORE_KEYS.has(key)) continue;
        if (configA[key] !== configB[key]) return false;
    }
    return true;
}
