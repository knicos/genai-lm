import { describe, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TextGenerator from './TextGenerator';
import type { TeachableLLM } from '@genai-fi/nanogpt';
import EE from 'eventemitter3';

describe('TextGenerator', () => {
    it('renders without a model', async ({ expect }) => {
        render(<TextGenerator />);
        expect(screen.getByText('generator.title')).toBeInTheDocument();
    });

    it('shows a no model warning', async ({ expect }) => {
        const user = userEvent.setup();
        render(<TextGenerator />);

        await user.click(screen.getByText('generator.generate'));

        expect(screen.getByText('modelStatus.none')).toBeInTheDocument();
    });

    it('can generate text', async ({ expect }) => {
        const genOnEvent = vi.fn();
        const genOffEvent = vi.fn();
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
            generator: vi.fn(() => ({
                on: genOnEvent,
                off: genOffEvent,
                generate: async function () {},
            })),
            tokeniser: null,
            getNumParams: () => 123456,
        } as unknown as TeachableLLM;

        const user = userEvent.setup();
        render(<TextGenerator model={mockModel} />);

        await user.click(screen.getByText('generator.generate'));

        expect(mockModel.generator).toHaveBeenCalled();
        expect(genOnEvent).toHaveBeenCalledWith('tokens', expect.any(Function));
    });

    it('can display generated text', async ({ expect }) => {
        const ee = new EE();
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
            generator: vi.fn(() => ({
                on: ee.on.bind(ee),
                off: ee.off.bind(ee),
                generate: async function () {},
            })),
            tokeniser: null,
            getNumParams: () => 123456,
        } as unknown as TeachableLLM;

        const user = userEvent.setup();
        render(<TextGenerator model={mockModel} />);

        await user.click(screen.getByText('generator.generate'));
        ee.emit('tokens', [1, 2, 3], 'abcde');

        expect(await screen.findByText('abcde')).toBeInTheDocument();
    });
});
