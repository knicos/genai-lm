import { describe, it } from 'vitest';
import renderWithContexts from '../../utilities/renderWithContexts';
import TuneTraining from './TuneTraining';

describe('TuneTraining workflow', () => {
    it('renders', ({ expect }) => {
        renderWithContexts(<TuneTraining />, { withWorkflow: true });
        expect(document.body).toBeInTheDocument();
    });
});
