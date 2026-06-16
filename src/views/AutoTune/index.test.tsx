import { describe, it } from 'vitest';
import renderWithContexts from '../../utilities/renderWithContexts';
import { Component as AutoTune } from './index';

describe('AutoTune view', () => {
    it('renders', ({ expect }) => {
        renderWithContexts(<AutoTune />);
        expect(document.body).toBeInTheDocument();
    });
});
