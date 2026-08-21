import { describe, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createStore } from 'jotai';
import { Provider } from 'jotai';
import { MemoryRouter } from 'react-router';
import { Training } from './Training';
import { dataTokens } from '../../state/data';
import { trainerJobIdAtom } from '../../state/trainer';
import { tokenise, TeachableLLM } from '@genai-fi/nanogpt';

function createModel() {
    const generator = {
        create: vi.fn(async () => []),
        dispose: vi.fn(),
    };

    return {
        config: { nLayer: 2, blockSize: 2 },
        tokeniser: {
            trained: true,
            decode: vi.fn(() => 'ab'),
            getVocab: vi.fn(() => ['a', 'b', 'c']),
        },
        responses: vi.fn(() => generator),
        training: {
            on: vi.fn(),
            off: vi.fn(),
            getJob: vi.fn(async () => ({
                id: 'test-job',
                state: 'running',
            })),
            breakpoints: vi.fn(),
        },
    } as unknown as TeachableLLM;
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

    it('renders visual elements when ready', async ({ expect }) => {
        const store = createStore();
        const tokenStore = new tokenise.TokenStore('tok', 'ds');
        tokenStore.appendShard(new Uint16Array([1, 2, 3, 4]));
        store.set(dataTokens, { tokens: tokenStore, tokeniserId: 'tok', datasetId: 'ds' });

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

        await tokenStore.dispose();
    });

    it('subscribes to trainer start/stop events', async ({ expect }) => {
        const model = createModel();
        const store = createStore();
        const tokenStore = new tokenise.TokenStore('tok', 'ds');
        tokenStore.appendShard(new Uint16Array([1, 2, 3, 4]));
        store.set(dataTokens, { tokens: tokenStore, tokeniserId: 'tok', datasetId: 'ds' });
        store.set(trainerJobIdAtom, 'test-job');

        render(
            <MemoryRouter>
                <Provider store={store}>
                    <Training
                        model={model}
                        loaded
                        step={{ name: 'predict', layer: 0, index: 2 }}
                    />
                </Provider>
            </MemoryRouter>
        );

        await vi.waitFor(() => expect(model.training.on).toHaveBeenCalledWith('running', expect.any(Function)));
        await vi.waitFor(() => expect(model.training.on).toHaveBeenCalledWith('completed', expect.any(Function)));

        await tokenStore.dispose();
    });
});
