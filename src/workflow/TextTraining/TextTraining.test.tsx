import { describe, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TextTraining from './TextTraining';
import { tokenise, data as dataModule, type ConversationStream, type TeachableLLM } from '@genai-fi/nanogpt';
import EE from 'eventemitter3';
import { createStore } from 'jotai';
import { loadedModelAtom } from '../../state/model';
import TestWrapper from '../../utilities/TestWrapper';
import { dataTokens } from '../../state/data';
import { WorkflowLayout } from '@genai-fi/base';

vi.mock('react-router');

function textToConversations(texts: string[]): ConversationStream[] {
    return [new dataModule.MemoryConversationStream(texts.map((text) => [{ role: 'text', content: text }]))];
}

describe('TextTraining', () => {
    it('renders without a model or data', async ({ expect }) => {
        render(
            <WorkflowLayout connections={[]}>
                <TextTraining />
            </WorkflowLayout>
        );
        expect(screen.getByText('training.title')).toBeInTheDocument();
        expect(screen.getByText('training.start')).toBeEnabled();
    });

    it('renders with a model and data', async ({ expect }) => {
        const dataset = ['some test text'];
        const tokeniser = new tokenise.CharTokeniser(100);
        await tokeniser.train(textToConversations(dataset));

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

        store.set(loadedModelAtom, mockModel);

        const task = new dataModule.MemoryConversationStream(dataset.map((text) => [{ role: 'text', content: text }]));
        const tokens = await tokenise.tokensFromStreams([task], tokeniser, 'dataset1');
        store.set(dataTokens, { tokens: tokens.trainingTokens, tokeniserId: 'test-tokeniser', datasetId: 'dataset1' });

        render(
            <TestWrapper initializeState={store}>
                <WorkflowLayout connections={[]}>
                    <TextTraining />
                </WorkflowLayout>
            </TestWrapper>
        );
        expect(await screen.findByText('training.title')).toBeInTheDocument();
        expect(screen.getByText('training.start')).toBeEnabled();
    });

    it('can start training', async ({ expect }) => {
        const user = userEvent.setup();
        const trainOnEvent = vi.fn();
        const trainOffEvent = vi.fn();
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
            training: {
                on: trainOnEvent,
                off: trainOffEvent,
                job: vi.fn(() => ({
                    id: 'test-job',
                    state: 'running',
                })),
                getJob: vi.fn(() => ({
                    id: 'test-job',
                    state: 'running',
                })),
                cancel: vi.fn(),
            },
            tokeniser: {
                trained: true,
                id: 'test-tokeniser',
            },
            model: {
                log: [],
            },
            meta: {},
            getNumParams: () => 123456,
            estimateTrainingMemoryUsage: () => 2000000000,
        } as unknown as TeachableLLM;

        const store = createStore();

        store.set(loadedModelAtom, mockModel);

        const dataset = ['some test text'];
        const tokeniser = new tokenise.CharTokeniser(100);
        const streams = textToConversations(dataset);
        await tokeniser.train(streams, undefined, 'dataset2');
        mockModel.tokeniser.id = tokeniser.id;
        const tokens = await tokenise.tokensFromStreams(streams, tokeniser, 'dataset2');
        store.set(dataTokens, { tokens: tokens.trainingTokens, tokeniserId: tokeniser.id, datasetId: 'dataset2' });

        render(
            <TestWrapper initializeState={store}>
                <WorkflowLayout connections={[]}>
                    <TextTraining />
                </WorkflowLayout>
            </TestWrapper>
        );

        ee.emit('loaded');

        await user.click(screen.getByText('training.start'));

        await vi.waitFor(() => expect(mockModel.training.job).toHaveBeenCalled());
        await vi.waitFor(() => expect(trainOnEvent).toHaveBeenCalledWith('completed', expect.any(Function)));
        await vi.waitFor(() => expect(trainOnEvent).toHaveBeenCalledWith('cancelled', expect.any(Function)));
        await vi.waitFor(() => expect(trainOnEvent).toHaveBeenCalledWith('error', expect.any(Function)));
    });
});
