import { describe, it } from 'vitest';
import renderWithContexts from '../../utilities/renderWithContexts';
import TokeniseData from './TokeniseData';

describe('TokeniseData workflow', () => {
    it('renders', ({ expect }) => {
        renderWithContexts(<TokeniseData />, { withWorkflow: true });
        expect(document.body).toBeInTheDocument();
    });
});
