import { describe, it } from 'vitest';
import renderWithContexts from '../../utilities/renderWithContexts';
import Foundation from './Foundation';

describe('Foundation workflow', () => {
    it('renders', ({ expect }) => {
        renderWithContexts(<Foundation />, { withWorkflow: true });
        expect(document.body).toBeInTheDocument();
    });
});
