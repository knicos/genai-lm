import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { describe, it } from 'vitest';
import renderWithContexts from '../../utilities/renderWithContexts';
import { BoxButton } from './BoxButton';

describe('BoxButton', () => {
    it('renders', ({ expect }) => {
        renderWithContexts(
            <BoxButton
                label="btn"
                icon={<AutoFixHighIcon />}
                widget="btn"
                onClick={() => {}}
            />,
            { withWorkflow: true }
        );
        expect(document.body).toBeInTheDocument();
    });
});
