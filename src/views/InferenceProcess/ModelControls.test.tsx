import { describe, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ModelControls, { type AnimationStep } from './ModelControls';
import { TeachableLLM } from '@genai-fi/nanogpt';

const steps: AnimationStep[] = [
    { name: 'next', layer: -1, index: 0 },
    { name: 'predict', layer: 0, index: 1 },
    { name: 'done', layer: 0, index: 2 },
];

function createModel() {
    return {
        config: { nLayer: 2, blockSize: 2 },
        tokeniser: {
            trained: true,
            decode: vi.fn(() => 'ab'),
            getVocab: vi.fn(() => ['a', 'b', 'c']),
        },
        training: {
            on: vi.fn(),
            off: vi.fn(),
        },
        responses: {
            on: vi.fn(),
            off: vi.fn(),
            hook: vi.fn(),
            resume: vi.fn(),
        },
    } as unknown as TeachableLLM;
}

describe('ModelControls', () => {
    it('renders controls and speed slider', ({ expect }) => {
        render(
            <ModelControls
                model={createModel()}
                steps={steps}
                onStepChange={() => {}}
                responseId="test-response1"
            />
        );

        expect(screen.getByLabelText('tools.pause')).toBeInTheDocument();
        expect(screen.getByLabelText('tools.step')).toBeDisabled();
        expect(screen.getByText('app.settings.speed')).toBeInTheDocument();
    });

    it('toggles pause/play and enables step button', async ({ expect }) => {
        const user = userEvent.setup();
        render(
            <ModelControls
                model={createModel()}
                steps={steps}
                onStepChange={() => {}}
                responseId="test-response1"
            />
        );

        await user.click(screen.getByLabelText('tools.pause'));
        expect(screen.getByLabelText('tools.play')).toBeInTheDocument();
        expect(screen.getByLabelText('tools.step')).toBeEnabled();
    });

    it('subscribes to generator start/stop events', ({ expect }) => {
        const model = createModel();
        const { on, off } = model.responses;
        const { unmount } = render(
            <ModelControls
                model={model}
                steps={steps}
                onStepChange={() => {}}
                responseId="test-response1"
            />
        );

        expect(on).toHaveBeenCalledWith('done', expect.any(Function));

        unmount();
        expect(off).toHaveBeenCalledWith('done', expect.any(Function));
    });
});
