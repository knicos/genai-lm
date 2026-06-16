import { describe, it } from 'vitest';
import renderWithContexts from '../../utilities/renderWithContexts';
import { Component as Checks } from './index';

describe('Checks view', () => {
    it('renders', ({ expect }) => {
        renderWithContexts(<Checks />);
        expect(document.body).toBeInTheDocument();
    });
});
