import { describe, it } from 'vitest';
import renderWithContexts from '../../utilities/renderWithContexts';
import RawPrompt from './RawPrompt';

describe('RawPrompt workflow', () => {
    it('renders', ({ expect }) => {
        renderWithContexts(<RawPrompt />, { withWorkflow: true });
        expect(document.body).toBeInTheDocument();
    });
});
