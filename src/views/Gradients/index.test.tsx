import { describe, it } from 'vitest';
import renderWithContexts from '../../utilities/renderWithContexts';
import { Component as Gradients } from './index';

describe('Gradients view', () => {
    it('renders', ({ expect }) => {
        renderWithContexts(<Gradients />);
        expect(document.body).toBeInTheDocument();
    });
});
