import { describe, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Inference } from './Inference';
import VirtualGenerator from './VirtualGenerator';

function createModel() {
    return {
        config: { nLayer: 2 },
        tokeniser: {
            trained: true,
            encode: vi.fn(() => [1, 2]),
            decode: vi.fn(() => 'ab'),
            getVocab: vi.fn(() => ['a', 'b', 'c']),
        },
    } as never;
}

function createVirtualGenerator() {
    const generator = {
        getProbabilitiesData: vi.fn(() => [[[0.7, 0.2, 0.1]]]),
        getAttentionData: vi.fn(() => [[[[[0.1, 0.9]]]]]),
        getEmbeddingsData: vi.fn(() => [[{ name: 'block_output_0', tensor: [[0.1, 0.9]] }]]),
        getTokens: vi.fn(() => [0, 1]),
        getLastMultinomialRand: vi.fn(() => 0.5),
        getLastLoss: vi.fn(() => 0.1),
        getConversation: vi.fn(() => [{ role: 'text', content: 'ab' }]),
        on: vi.fn(),
        off: vi.fn(),
        removeAllListeners: vi.fn(),
        stop: vi.fn(),
        dispose: vi.fn(),
        reset: vi.fn(),
    } as never;

    const vg = new VirtualGenerator(generator);
    vg.next = vi.fn(async () => {});
    vg.finishStep = vi.fn();
    return vg;
}

describe('Inference', () => {
    it('renders missing model hint when not ready', ({ expect }) => {
        render(
            <MemoryRouter>
                <Inference
                    generator={null}
                    model={null}
                    loaded={false}
                    step={null}
                />
            </MemoryRouter>
        );

        expect(screen.getByText('tools.modelMissingHint')).toBeInTheDocument();
    });

    it('renders visual components when model is ready', ({ expect }) => {
        const model = createModel();
        const generator = createVirtualGenerator();

        render(
            <MemoryRouter>
                <Inference
                    generator={generator as never}
                    model={model}
                    loaded
                    step={{ name: 'predict', layer: 0, index: 2 }}
                />
            </MemoryRouter>
        );

        expect(screen.getAllByText(/tools.model/).length).toBeGreaterThan(0);
        expect(screen.getByText('training.predictionsHeader')).toBeInTheDocument();
    });

    it('runs next step on virtual generator', async ({ expect }) => {
        const model = createModel();
        const generator = createVirtualGenerator();

        render(
            <MemoryRouter>
                <Inference
                    generator={generator as never}
                    model={model}
                    loaded
                    step={{ name: 'next', layer: -1, index: 0 }}
                />
            </MemoryRouter>
        );

        await waitFor(() => expect(generator.next).toHaveBeenCalled());
    });
});
