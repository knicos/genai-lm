import { describe, it } from 'vitest';
import renderWithContexts from '../../utilities/renderWithContexts';
import { Component as Vocabulary } from './index';

describe('Vocabulary view', () => {
    it('renders', ({ expect }) => {
        renderWithContexts(<Vocabulary />);
        expect(document.body).toBeInTheDocument();
    });
});
