import { describe, it } from 'vitest';
import renderWithContexts from '../../utilities/renderWithContexts';
import Tokeniser from './Tokeniser';

describe('Tokeniser workflow', () => {
    it('renders', ({ expect }) => {
        renderWithContexts(<Tokeniser />, { withWorkflow: true });
        expect(document.body).toBeInTheDocument();
    });
});
