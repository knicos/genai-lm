import { describe, it } from 'vitest';
import { render } from '@testing-library/react';
import ModelLines from './ModelLines';

describe('ModelLines', () => {
    it('renders svg path', ({ expect }) => {
        const { container } = render(<ModelLines />);
        expect(container.querySelector('svg')).toBeInTheDocument();
        expect(container.querySelector('path')).toBeInTheDocument();
    });
});
