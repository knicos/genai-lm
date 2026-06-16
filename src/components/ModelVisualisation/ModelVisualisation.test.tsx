import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import ModelVisualisation from './ModelVisualisation';

describe('ModelVisualisation', () => {
    it('renders', ({ expect }) => {
        render(<ModelVisualisation />);
        expect(document.body).toBeInTheDocument();
    });
});
