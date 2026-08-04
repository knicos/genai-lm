import { describe, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Predictions from './Predictions';

describe('Predictions', () => {
    const vocab = ['a', 'b', 'c', 'd'];

    it('renders padded prediction rows', ({ expect }) => {
        const { container } = render(
            <Predictions
                predictions={[0.7, 0.2, 0.1, 0]}
                vocab={vocab}
                size={3}
                finished={false}
                committed={false}
                multinomialRand={null}
            />
        );

        expect(screen.getByText('training.predictionsHeader')).toBeInTheDocument();
        expect(container.querySelectorAll('tr')).toHaveLength(3);
    });

    it('shows done indicator when finished and target is present', ({ expect }) => {
        const { container } = render(
            <Predictions
                predictions={[0.7, 0.2, 0.1, 0]}
                vocab={vocab}
                target={0}
                size={3}
                finished
                committed
                multinomialRand={0.2}
                inferenceMode
            />
        );

        expect(container.querySelector('table')).toBeInTheDocument();
    });

    it('renders multinomial in inference mode', ({ expect }) => {
        const { container } = render(
            <Predictions
                predictions={[0.7, 0.2, 0.1, 0]}
                vocab={vocab}
                target={1}
                size={3}
                finished
                committed
                multinomialRand={0.6}
                inferenceMode
            />
        );

        expect(container.querySelectorAll('svg').length).toBeGreaterThan(0);
    });
});
