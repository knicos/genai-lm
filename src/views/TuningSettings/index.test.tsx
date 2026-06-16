import { describe, it } from 'vitest';
import renderWithContexts from '../../utilities/renderWithContexts';
import { Component as TuningSettings } from './index';

describe('TuningSettings view', () => {
    it('renders', ({ expect }) => {
        renderWithContexts(<TuningSettings />);
        expect(document.body).toBeInTheDocument();
    });
});
