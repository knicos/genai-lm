import { describe, it } from 'vitest';
import renderWithContexts from '../../utilities/renderWithContexts';
import ModelDesign from './ModelDesign';

describe('ModelDesign workflow', () => {
    it('renders', ({ expect }) => {
        renderWithContexts(<ModelDesign />, { withWorkflow: true });
        expect(document.body).toBeInTheDocument();
    });
});
