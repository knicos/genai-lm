import { describe, it } from 'vitest';
import renderWithContexts from '../../utilities/renderWithContexts';
import Sharing from './Sharing';

describe('Sharing workflow', () => {
    it('renders', ({ expect }) => {
        renderWithContexts(<Sharing />, { withWorkflow: true });
        expect(document.body).toBeInTheDocument();
    });
});
