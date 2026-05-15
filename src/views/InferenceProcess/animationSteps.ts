import { GPTConfig } from '@genai-fi/nanogpt';
import { AnimationStep } from './ModelControls';

export function inferenceSteps(config: GPTConfig) {
    const s: AnimationStep[] = [];
    s.push({ name: 'next', layer: -1, index: 0, multiplier: 4 });
    s.push({ name: 'tokenise', layer: -1, index: 1 });
    for (let i = 0; i < config.nLayer; i++) {
        s.push({ name: 'predict', layer: i, index: i + 2 });
    }
    s.push({ name: 'updating', layer: config.nLayer - 1, index: config.nLayer + 2, multiplier: 4 });
    s.push({ name: 'done', layer: config.nLayer - 1, index: config.nLayer + 3, multiplier: 4 });
    return s;
}

export function trainingSteps(config: GPTConfig) {
    const s: AnimationStep[] = [];
    s.push({ name: 'next', layer: -1, index: 0 });
    s.push({ name: 'tokenise', layer: -1, index: 1 });
    for (let i = 0; i < config.nLayer; i++) {
        s.push({ name: 'predict', layer: i, index: i + 2 });
    }
    s.push({ name: 'updating', layer: config.nLayer - 1, index: config.nLayer + 2 });
    s.push({ name: 'done', layer: config.nLayer - 1, index: config.nLayer + 3 });
    return s;
}
