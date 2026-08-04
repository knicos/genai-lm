import { describe, it, vi } from 'vitest';
import VirtualGenerator from './VirtualGenerator';

function createBaseGenerator() {
    return {
        removeAllListeners: vi.fn(),
        step: vi.fn(async () => [{ role: 'text', content: 'hello', _completed: true }]),
        stop: vi.fn(),
        reset: vi.fn(),
        getEmbeddingsData: vi.fn(() => [[{ name: 'block_output_0', tensor: [[0.1]] }]]),
        getProbabilitiesData: vi.fn(() => [[[0.9]]]),
        getAttentionData: vi.fn(() => [[[[[1]]]]]),
        getLastLoss: vi.fn(() => 0.5),
        getTokens: vi.fn(() => [1, 2]),
        getConversation: vi.fn(() => [{ role: 'text', content: 'hello' }]),
        getLastMultinomialRand: vi.fn(() => 0.3),
    };
}

describe('VirtualGenerator', () => {
    it('captures initial state from wrapped generator', ({ expect }) => {
        const wrapped = createBaseGenerator();
        const vg = new VirtualGenerator(wrapped as never);
        expect(vg.getTokens()).toEqual([1, 2]);
        expect(vg.getLastLoss()).toBe(0.5);
    });

    it('emits start and stop around generate lifecycle', async ({ expect }) => {
        const wrapped = createBaseGenerator();
        const vg = new VirtualGenerator(wrapped as never);
        const onStart = vi.fn();
        const onStop = vi.fn();

        vg.on('start', onStart);
        vg.on('stop', onStop);

        const promise = vg.generate([{ role: 'text', content: 'a' }] as never);
        expect(onStart).toHaveBeenCalled();

        await vg.next();
        await promise;

        expect(onStop).toHaveBeenCalled();
    });

    it('finishStep copies latest generator data and emits tokens', ({ expect }) => {
        const wrapped = createBaseGenerator();
        const vg = new VirtualGenerator(wrapped as never);
        const onTokens = vi.fn();

        vg.on('tokens', onTokens);
        vg.finishStep();

        expect(vg.getProbabilitiesData()).toEqual([[[0.9]]]);
        expect(onTokens).toHaveBeenCalled();
    });

    it('reset clears local state and emits reset', ({ expect }) => {
        const wrapped = createBaseGenerator();
        const vg = new VirtualGenerator(wrapped as never);
        const onReset = vi.fn();
        vg.on('reset', onReset);

        vg.reset();

        expect(vg.getTokens()).toEqual([]);
        expect(onReset).toHaveBeenCalled();
    });
});
