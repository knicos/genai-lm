import { describe, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Evaluation from './Evaluation';
import type { TeachableLLM, TrainingLogEntry, TrainingProgress } from '@genai-fi/nanogpt';
import EE from 'eventemitter3';

describe('Evaluation', () => {
    it('renders without a model', async ({ expect }) => {
        render(<Evaluation />);
        expect(screen.getByText('evaluation.title')).toBeInTheDocument();
        expect(screen.getByText('evaluation.quality')).toBeInTheDocument();
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
            model: {
                log: [],
            },
        } as unknown as TeachableLLM;
        render(<Evaluation model={mockModel} />);
        expect(screen.getByText('evaluation.title')).toBeInTheDocument();
        expect(screen.getByText('evaluation.quality')).toBeInTheDocument();
    });

    it('updates on log event', async ({ expect }) => {
        const ee = new EE();
        const mockModel = {
            on: (event: string, cb: (log: TrainingLogEntry, progress: TrainingProgress) => void) => {
                if (event === 'trainStep') {
                    ee.on(event, cb);
                }
            },
            off: (event: string, cb: (log: TrainingLogEntry, progress: TrainingProgress) => void) => {
                if (event === 'trainStep') {
                    ee.off(event, cb);
                }
            },
            status: 'ready',
            config: {
                nLayers: 4,
                nHeads: 4,
                nEmbed: 128,
                vocabSize: 65,
                blockSize: 256,
            },
            model: {
                log: [],
            },
        } as unknown as TeachableLLM;
        render(<Evaluation model={mockModel} />);

        ee.emit('trainStep', { valLoss: 2.0 }, { samplesPerSecond: 100, memory: 200 });

        waitFor(() => expect(screen.getByTestId('quality-value')).toHaveTextContent('3%'));
    });
});
