import { describe, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import DataProgress from './DataProgress';

describe('DataProgress', () => {
    it('shows empty progress', async ({ expect }) => {
        render(
            <DataProgress
                samplesProcessed={0}
                desiredSamples={0}
            />
        );

        expect(screen.getByTestId('target-icon')).toBeInTheDocument();
        expect(screen.getByTestId('progress-bar')).toHaveAttribute('aria-valuenow', '0');
    });

    it('shows the correct target', async ({ expect }) => {
        render(
            <DataProgress
                samplesProcessed={0}
                desiredSamples={10}
            />
        );

        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByTestId('progress-bar')).toHaveAttribute('aria-valuenow', '0');
    });

    it('shows correct progress', async ({ expect }) => {
        render(
            <DataProgress
                samplesProcessed={5}
                desiredSamples={10}
            />
        );

        expect(screen.getByTestId('progress-bar')).toHaveAttribute('aria-valuenow', '5');
    });
});
