import { describe, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ModelBox from './ModelBox';

describe('ModelBox', () => {
    it('shows idle status by default', ({ expect }) => {
        render(
            <ModelBox
                layers={4}
                step={10}
            />
        );

        expect(screen.getByText('tools.modelIdle')).toBeInTheDocument();
    });

    it('shows predicting while step is within layer range', ({ expect }) => {
        render(
            <ModelBox
                layers={4}
                step={2}
                inferenceMode
            />
        );

        expect(screen.getByText('tools.modelPredicting')).toBeInTheDocument();
    });

    it('shows deciding while spinning in inference mode', ({ expect }) => {
        vi.useFakeTimers();
        render(
            <ModelBox
                layers={3}
                step={3}
                spinning
                inferenceMode
            />
        );

        expect(screen.getByText('tools.modelDeciding')).toBeInTheDocument();
        vi.useRealTimers();
    });
});
