import { describe, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Clock from './Clock';

describe('Clock', () => {
    it('renders', async ({ expect }) => {
        render(
            <Clock
                duration={30 * 60 * 1000}
                totalDuration={1 * 60 * 60 * 1000}
                remaining={0}
                initialMode="time"
            />
        );
        expect(screen.getByText('30')).toBeInTheDocument();
        expect(screen.getByText('training.minutes')).toBeInTheDocument();
        expect(screen.getByTestId('circle-progress')).toBeInTheDocument();
    });

    it('renders power', async ({ expect }) => {
        render(
            <Clock
                duration={30}
                totalDuration={1}
                remaining={0}
                initialMode="energy"
            />
        );
        expect(screen.getByText('training.Wh')).toBeInTheDocument();
        expect(screen.getByTestId('circle-progress')).toBeInTheDocument();
    });
});
