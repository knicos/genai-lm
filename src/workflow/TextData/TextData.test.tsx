import { describe, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TextData from './TextData';
import type { TeachableLLM } from '@genai-fi/nanogpt';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

describe('TextData', () => {
    it('renders without a model', async ({ expect }) => {
        render(
            <DndProvider backend={HTML5Backend}>
                <TextData onDatasetChange={() => {}} />
            </DndProvider>
        );
        expect(screen.getByText('data.title')).toBeInTheDocument();
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
        render(
            <DndProvider backend={HTML5Backend}>
                <TextData
                    onDatasetChange={() => {}}
                    model={mockModel}
                />
            </DndProvider>
        );

        expect(screen.getByText('data.title')).toBeInTheDocument();
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

        render(
            <DndProvider backend={HTML5Backend}>
                <TextData onDatasetChange={dataCB} />
            </DndProvider>
        );

        await user.click(screen.getByText('data.search'));

        expect(await screen.findByText('Movies')).toBeInTheDocument();

        const cardElement = screen.getByTestId('card-movie-15minutes');
        expect(cardElement).toBeInTheDocument();

        await user.click(cardElement);

        await waitFor(() => expect(dataCB).toHaveBeenCalled(), { timeout: 10000 });
    });
});
