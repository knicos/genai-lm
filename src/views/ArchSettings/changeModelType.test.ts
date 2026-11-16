import { describe, expect, it } from 'vitest';
import type { ExtendedConfig } from '../../state/model';
import { changeModelType } from './changeModelType';

const common = {
    id: 'test-model',
    tokenizer: 'bpe' as const,
    vocabSize: 200,
    blockSize: 128,
    nLayer: 4,
    nHead: 3,
    nEmbed: 192,
    mlpFactor: 4,
    ropeTheta: 10000,
};

const configs: ExtendedConfig[] = [
    { ...common, modelType: 'GenAI_NanoGPT_v1', useRope: false },
    { ...common, modelType: 'GenAI_NanoGPT_v2', windowSize: 'SSLL' },
    { ...common, modelType: 'qwen3', kvHeads: 1, headDim: 64, mlpSize: 512, tieEmbeddings: true },
    { ...common, modelType: 'llama', kvHeads: 1, headDim: 64, mlpSize: 512, tieEmbeddings: false },
    { ...common, modelType: 'loop_nano', loopSize: 3 },
];

describe('changeModelType', () => {
    it('preserves the original object when the type is unchanged', () => {
        for (const config of configs) {
            expect(changeModelType(config, config.modelType)).toBe(config);
        }
    });

    it('preserves common settings across every architecture change', () => {
        for (const config of configs) {
            for (const { modelType } of configs) {
                const result = changeModelType(config, modelType);
                expect(result).toMatchObject({ ...common, modelType });
                if (modelType === 'GenAI_NanoGPT_v1') {
                    expect(result).toHaveProperty('useRope', config.modelType === modelType ? false : true);
                }
            }
        }
    });

    it('preserves compatible architecture-specific settings', () => {
        const qwen = configs[2];
        const result = changeModelType(qwen, 'llama');

        expect(result).toMatchObject({ kvHeads: 1, headDim: 64, mlpSize: 512, tieEmbeddings: true });
    });
});
