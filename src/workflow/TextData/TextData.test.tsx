import { describe, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TextData from './TextData';
import type { TeachableLLM } from '@genai-fi/nanogpt';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { createStore } from 'jotai';
import { modelAtom } from '../../state/model';
import TestWrapper from '../../utilities/TestWrapper';
import JotaiObserver from '../../utilities/Observer';
import { dataEntries } from '../../state/data';
import { WorkflowLayout } from '@genai-fi/base';

describe('TextData', () => {
    it('renders without a model', async ({ expect }) => {
        render(
            <DndProvider backend={HTML5Backend}>
                <WorkflowLayout connections={[]}>
                    <TextData />
                </WorkflowLayout>
            </DndProvider>
        );
        expect(screen.getByText('data.add')).toBeInTheDocument();
        expect(screen.getByText('data.dataHint')).toBeInTheDocument();
        expect(screen.getByText('data.search')).toBeInTheDocument();
    });

    it('renders with a model', async ({ expect }) => {
        const mockModel = {
            on: () => {},
            off: () => {},
            status: 'ready',
            config: {
                nLayers: 4,
                nHeads: 4,
                nEmbed: 128,
                vocabSize: 65,
                blockSize: 256,
            },
            meta: {
                name: 'TestModel1',
            },
            tokeniser: null,
            getNumParams: () => 123456,
        } as unknown as TeachableLLM;

        const store = createStore();

        store.set(modelAtom, mockModel);

        render(
            <TestWrapper initializeState={store}>
                <DndProvider backend={HTML5Backend}>
                    <WorkflowLayout connections={[]}>
                        <TextData />
                    </WorkflowLayout>
                </DndProvider>
            </TestWrapper>
        );

        expect(screen.getByText('data.add')).toBeInTheDocument();
    });

    it('allows data search and select', { timeout: 10000 }, async ({ expect }) => {
        Element.prototype.getBoundingClientRect = vi.fn(() => ({
            width: 960, // Enough for 3 cards
            height: 100,
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            x: 0,
            y: 0,
            toJSON: () => {},
        }));

        const user = userEvent.setup();
        const dataCB = vi.fn();

        // Mock fetch
        global.fetch = vi.fn(() =>
            Promise.resolve({
                json: () => {
                    return Promise.resolve({
                        datasets: [
                            {
                                id: 'movie-15minutes',
                                title: 'Movie 15 Minutes',
                                tags: ['Movies'],
                                size: 15,
                                complexity: 'low',
                                url: 'https://example.com/movie-15minutes',
                                mime: 'text/plain',
                                language: 'en',
                                sampleContent: 'Sample movie data...',
                                conversational: false,
                                restricted: false,
                                modality: 'text',
                                rating: 0,
                            },
                        ],
                    });
                },
            })
        ) as unknown as typeof fetch;

        render(
            <DndProvider backend={HTML5Backend}>
                <JotaiObserver
                    node={dataEntries}
                    onChange={dataCB}
                />
                <WorkflowLayout connections={[]}>
                    <TextData />
                </WorkflowLayout>
            </DndProvider>
        );

        await user.click(screen.getByText('data.search'));

        expect(await screen.findByText('Movies', undefined, { timeout: 10000 })).toBeInTheDocument();

        const cardElement = screen.getByTestId('card-movie-15minutes');
        expect(cardElement).toBeInTheDocument();

        await user.click(cardElement);

        await waitFor(() => expect(dataCB).toHaveBeenCalled(), { timeout: 10000 });
    });
});
