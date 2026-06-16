import { describe, it, vi } from 'vitest';
import renderWithContexts from '../../utilities/renderWithContexts';
import InstructData from './InstructData';

vi.mock('file-saver', () => ({ saveAs: vi.fn() }));

describe('InstructData workflow', () => {
    it('renders', ({ expect }) => {
        renderWithContexts(<InstructData />, { withWorkflow: true });
        expect(document.body).toBeInTheDocument();
    });
});
