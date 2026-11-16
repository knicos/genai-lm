import type { ExtendedConfig } from '../../state/model';

export function changeModelType(settings: ExtendedConfig, modelType: ExtendedConfig['modelType']): ExtendedConfig {
    if (settings.modelType === modelType) {
        return settings;
    }

    switch (modelType) {
        case 'GenAI_NanoGPT_v1':
            return { ...settings, modelType, useRope: true };
        case 'GenAI_NanoGPT_v2':
        case 'qwen3':
        case 'llama':
        case 'loop_nano':
            return { ...settings, modelType };
    }
}
