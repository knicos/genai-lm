import { describe, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Inference } from './Inference';

function createModel() {
    return {
        config: { nLayer: 2 },
        tokeniser: {
            trained: true,
            encode: vi.fn(() => [1, 2]),
            decode: vi.fn(() => 'ab'),
            getVocab: vi.fn(() => ['a', 'b', 'c']),
        },
        responses: {
            create: vi.fn(async () => ({
                output: [],
            })),
            on: vi.fn(),
            off: vi.fn(),
            hook: vi.fn(),
            unhook: vi.fn(),
            resume: vi.fn(),
        },
    } as never;
}

describe('Inference', () => {
    it('renders missing model hint when not ready', ({ expect }) => {
        render(
            <MemoryRouter>
                <Inference
                    responseId={null}
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

        render(
            <MemoryRouter>
                <Inference
                    responseId="test-response1"
                    model={model}
                    loaded
                    step={{ name: 'predict', layer: 0, index: 2 }}
                />
            </MemoryRouter>
        );

        expect(screen.getAllByText(/tools.model/).length).toBeGreaterThan(0);
        expect(screen.getByText('training.predictionsHeader')).toBeInTheDocument();
    });

    /*it('runs next step on virtual generator', async ({ expect }) => {
        const model = createModel();

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
    });*/
});
