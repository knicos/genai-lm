import { describe, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import LossBox from './LossBox';

const model = {
    config: { vocabSize: 100 },
} as never;

describe('LossBox', () => {
    it('renders title and loading icon when no loss exists', ({ expect }) => {
        const { container } = render(<LossBox model={model} />);
        expect(screen.getByText('tools.loss')).toBeInTheDocument();
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders formatted metric when loss exists', ({ expect }) => {
        render(
            <LossBox
                model={model}
                loss={1.23}
            />
        );

        expect(screen.getByText(/1\./)).toBeInTheDocument();
    });
});
