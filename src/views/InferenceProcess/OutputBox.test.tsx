import { describe, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import OutputBox from './OutputBox';

describe('OutputBox', () => {
    it('renders empty placeholder when no token is selected', ({ expect }) => {
        const { container } = render(<OutputBox />);
        expect(container.querySelector('span')).toBeInTheDocument();
        expect(container.textContent).toBe('');
    });

    it('renders selected token text', ({ expect }) => {
        render(<OutputBox selectedToken="hello" />);
        expect(screen.getByText('hello')).toBeInTheDocument();
    });
});
