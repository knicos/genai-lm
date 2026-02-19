import { describe, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TextTraining from './TextTraining';
import { CharTokeniser, tasks, tokensFromTasks, type TeachableLLM } from '@genai-fi/nanogpt';
import EE from 'eventemitter3';
import { createStore } from 'jotai';
import { modelAtom } from '../../state/model';
import TestWrapper from '../../utilities/TestWrapper';
import { dataTokens } from '../../state/data';

vi.mock('react-router-dom');

describe('TextTraining', () => {
    it('renders without a model or data', async ({ expect }) => {
        render(<TextTraining />);
        expect(screen.getByText('training.title')).toBeInTheDocument();
        expect(screen.getByText('training.start')).toBeEnabled();
    });

    it('renders with a model and data', async ({ expect }) => {
        const dataset = ['some test text'];
        const tokeniser = new CharTokeniser(100);
        await tokeniser.train(dataset);

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
            tokeniser,
            model: {
                log: [],
            },
            meta: {},
            getNumParams: () => 123456,
        } as unknown as TeachableLLM;

        const store = createStore();

        store.set(modelAtom, mockModel);

        const task = new tasks.PretrainingTask(dataset);
        const tokens = await tokensFromTasks([task], tokeniser);
        store.set(dataTokens, tokens);

        render(
            <TestWrapper initializeState={store}>
                <TextTraining />
            </TestWrapper>
        );
        expect(await screen.findByText('training.title')).toBeInTheDocument();
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
                getTotalSamples: () => 1000,
                options: {},
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

        const store = createStore();

        store.set(modelAtom, mockModel);

        const dataset = ['some test text'];
        const tokeniser = new CharTokeniser(100);
        await tokeniser.train(dataset);
        const task = new tasks.PretrainingTask(dataset);
        const tokens = await tokensFromTasks([task], tokeniser);
        store.set(dataTokens, tokens);

        render(
            <TestWrapper initializeState={store}>
                <TextTraining />
            </TestWrapper>
        );

        ee.emit('loaded');

        await user.click(screen.getByText('training.start'));

        await waitFor(() => expect(mockModel.trainer).toHaveBeenCalled());
        await waitFor(() => expect(trainOnEvent).toHaveBeenCalledWith('log', expect.any(Function)));
        await waitFor(() => expect(trainFunc).toHaveBeenCalled());
    });
});
