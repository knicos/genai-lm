import { describe, it } from 'vitest';
import renderWithContexts from '../../utilities/renderWithContexts';
import { Component as ModelDebug } from './index';

describe('ModelDebug view', () => {
    it('renders', ({ expect }) => {
        renderWithContexts(<ModelDebug />);
        expect(document.body).toBeInTheDocument();
    });
});
