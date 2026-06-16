import { describe, it } from 'vitest';
import renderWithContexts from '../../utilities/renderWithContexts';
import BoxLink from './BoxLink';

describe('BoxLink', () => {
    it('renders', ({ expect }) => {
        renderWithContexts(
            <BoxLink
                title="link"
                link="home"
                widget="link"
                active
            />,
            { withWorkflow: true }
        );
        expect(document.body).toBeInTheDocument();
    });
});
