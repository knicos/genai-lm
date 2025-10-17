import { describe, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ModelLoader from './ModelLoader';
import type { TeachableLLM } from '@genai-fi/nanogpt';

describe('ModelLoader', () => {
    it('renders without a model', async ({ expect }) => {
        render(<ModelLoader onModel={() => {}} />);
        expect(screen.getByText('model.title')).toBeInTheDocument();
        expect(screen.getByText('model.modelHint')).toBeInTheDocument();
        expect(screen.getByText('model.search')).toBeInTheDocument();
    });

    it('renders with a model', async ({ expect }) => {
        const mockModel = {
            on: () => {},
            off: () => {},
            status: 'ready',
            ready: true,
            loaded: true,
            busy: false,
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
        } as unknown as TeachableLLM;
        render(
            <ModelLoader
                onModel={() => {}}
                model={mockModel}
            />
        );

        expect(await screen.findByText('TestModel1')).toBeInTheDocument();
        expect(screen.getByText('model.layers')).toBeInTheDocument();
    });

    it('allows model search and select', { timeout: 10000 }, async ({ expect }) => {
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
        const modelCB = vi.fn();

        render(<ModelLoader onModel={modelCB} />);

        await user.click(screen.getByText('model.search'));

        expect(await screen.findByText('Untrained')).toBeInTheDocument();

        const cardElement = screen.getByTestId('card-untrained-small');
        expect(cardElement).toBeInTheDocument();

        await user.click(cardElement);

        await waitFor(() => expect(modelCB).toHaveBeenCalled(), { timeout: 10000 });
    });
});
