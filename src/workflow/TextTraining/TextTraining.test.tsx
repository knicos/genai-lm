import { describe, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TextTraining from './TextTraining';
import { type TeachableLLM } from '@genai-fi/nanogpt';
import EE from 'eventemitter3';

describe('TextTraining', () => {
    it('renders without a model or data', async ({ expect }) => {
        render(<TextTraining />);
        expect(screen.getByText('training.title')).toBeInTheDocument();
        expect(screen.getByText('training.start')).toBeDisabled();
    });

    it('renders with a model and data', async ({ expect }) => {
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
            tokeniser: null,
            model: {
                log: [],
            },
            meta: {},
            getNumParams: () => 123456,
        } as unknown as TeachableLLM;
        render(
            <TextTraining
                model={mockModel}
                dataset={['some test text']}
            />
        );
        expect(screen.getByText('training.title')).toBeInTheDocument();
        expect(screen.getByText('training.start')).toBeEnabled();
    });

    it('can start training', async ({ expect }) => {
        const user = userEvent.setup();
        const trainOnEvent = vi.fn();
        const trainOffEvent = vi.fn();
        const trainFunc = vi.fn(async () => {});
        const ee = new EE();

        const mockModel = {
            on: ee.on.bind(ee),
            off: ee.off.bind(ee),
            status: 'ready',
            loaded: true,
            ready: true,
            config: {
                nLayers: 4,
                nHeads: 4,
                nEmbed: 128,
                vocabSize: 65,
                blockSize: 256,
            },
            trainer: vi.fn(() => ({
                on: trainOnEvent,
                off: trainOffEvent,
                prepare: async () => {},
                train: trainFunc,
            })),
            tokeniser: {
                trained: true,
            },
            model: {
                log: [],
            },
            meta: {},
            getNumParams: () => 123456,
            estimateTrainingMemoryUsage: () => 2000000000,
        } as unknown as TeachableLLM;

        render(
            <TextTraining
                model={mockModel}
                dataset={['some test text']}
            />
        );

        ee.emit('loaded');
        await waitFor(() => expect(mockModel.trainer).toHaveBeenCalled());

        await user.click(screen.getByText('training.start'));

        expect(trainOnEvent).toHaveBeenCalledWith('log', expect.any(Function));
        await waitFor(() => expect(trainFunc).toHaveBeenCalled());
    });
});
