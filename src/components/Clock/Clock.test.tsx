import { describe, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Clock from './Clock';

describe('Clock', () => {
    it('renders', async ({ expect }) => {
        render(
            <Clock
                duration={30 * 60 * 1000}
                totalDuration={1 * 60 * 60 * 1000}
            />
        );
        expect(screen.getByText('30')).toBeInTheDocument();
        expect(screen.getByText('training.minutes')).toBeInTheDocument();
        expect(screen.getByTestId('circle-progress')).toBeInTheDocument();
    });
});
