import { describe, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createStore } from 'jotai';
import { Provider } from 'jotai';
import { MemoryRouter } from 'react-router-dom';
import { Training } from './Training';
import { dataTokens } from '../../state/data';
import { trainerAtom } from '../../state/trainer';

function createModel() {
    const generator = {
        generate: vi.fn(async () => []),
        getProbabilitiesData: vi.fn(() => [[0.7, 0.2, 0.1]]),
        getAttentionData: vi.fn(() => [[[[0.1, 0.9]]]]),
        getEmbeddingsData: vi.fn(() => [[{ name: 'block_output_0', tensor: [[0.1, 0.9]] }]]),
        getLastLoss: vi.fn(() => 1.23),
        dispose: vi.fn(),
    };

    return {
        config: { nLayer: 2, blockSize: 2 },
        tokeniser: {
            trained: true,
            decode: vi.fn(() => 'ab'),
            getVocab: vi.fn(() => ['a', 'b', 'c']),
        },
        generator: vi.fn(() => generator),
    } as never;
}

function createTrainer() {
    return {
        isTraining: false,
        on: vi.fn(),
        off: vi.fn(),
    };
}

describe('Training', () => {
    it('renders hint when not ready', ({ expect }) => {
        render(
            <MemoryRouter>
                <Training
                    model={null}
                    loaded={false}
                    step={null}
                />
            </MemoryRouter>
        );

        expect(screen.getByText('tools.modelMissingHint')).toBeInTheDocument();
    });

    it('renders visual elements when ready', ({ expect }) => {
        const store = createStore();
        store.set(dataTokens, { tokens: [new Uint16Array([1, 2, 3, 4])], tokeniserId: 'tok', datasetId: 'ds' });
        store.set(trainerAtom, createTrainer() as never);

        render(
            <MemoryRouter>
                <Provider store={store}>
                    <Training
                        model={createModel()}
                        loaded
                        step={{ name: 'predict', layer: 0, index: 2 }}
                    />
                </Provider>
            </MemoryRouter>
        );

        expect(screen.getAllByText(/tools.model/).length).toBeGreaterThan(0);
        expect(screen.getByText('training.predictionsHeader')).toBeInTheDocument();
    });

    it('subscribes to trainer start/stop events', ({ expect }) => {
        const trainer = createTrainer();
        const store = createStore();
        store.set(dataTokens, { tokens: [new Uint16Array([1, 2, 3, 4])], tokeniserId: 'tok', datasetId: 'ds' });
        store.set(trainerAtom, trainer as never);

        render(
            <MemoryRouter>
                <Provider store={store}>
                    <Training
                        model={createModel()}
                        loaded
                        step={{ name: 'predict', layer: 0, index: 2 }}
                    />
                </Provider>
            </MemoryRouter>
        );

        expect(trainer.on).toHaveBeenCalledWith('start', expect.any(Function));
        expect(trainer.on).toHaveBeenCalledWith('stop', expect.any(Function));
    });
});
