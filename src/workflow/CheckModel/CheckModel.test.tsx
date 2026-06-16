import { describe, it } from 'vitest';
import renderWithContexts from '../../utilities/renderWithContexts';
import CheckModel from './CheckModel';

describe('CheckModel workflow', () => {
    it('renders', ({ expect }) => {
        renderWithContexts(<CheckModel />, { withWorkflow: true });
        expect(document.body).toBeInTheDocument();
    });
});
