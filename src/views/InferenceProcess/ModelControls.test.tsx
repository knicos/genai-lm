import { describe, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ModelControls, { type AnimationStep } from './ModelControls';
import EE from 'eventemitter3';

const steps: AnimationStep[] = [
    { name: 'next', layer: -1, index: 0 },
    { name: 'predict', layer: 0, index: 1 },
    { name: 'done', layer: 0, index: 2 },
];

describe('ModelControls', () => {
    it('renders controls and speed slider', ({ expect }) => {
        render(
            <ModelControls
                steps={steps}
                onStepChange={() => {}}
                generator={null}
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
                steps={steps}
                onStepChange={() => {}}
                generator={null}
            />
        );

        await user.click(screen.getByLabelText('tools.pause'));
        expect(screen.getByLabelText('tools.play')).toBeInTheDocument();
        expect(screen.getByLabelText('tools.step')).toBeEnabled();
    });

    it('subscribes to generator start/stop events', ({ expect }) => {
        const on = vi.fn();
        const off = vi.fn();
        const generator = { on, off } as unknown as EE;

        const { unmount } = render(
            <ModelControls
                steps={steps}
                onStepChange={() => {}}
                generator={generator as never}
            />
        );

        expect(on).toHaveBeenCalledWith('start', expect.any(Function));
        expect(on).toHaveBeenCalledWith('stop', expect.any(Function));

        unmount();
        expect(off).toHaveBeenCalledWith('start', expect.any(Function));
        expect(off).toHaveBeenCalledWith('stop', expect.any(Function));
    });
});
