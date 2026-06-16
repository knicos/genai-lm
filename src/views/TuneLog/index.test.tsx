import { describe, it } from 'vitest';
import renderWithContexts from '../../utilities/renderWithContexts';
import { Component as TuneLog } from './index';

describe('TuneLog view', () => {
    it('renders', ({ expect }) => {
        renderWithContexts(<TuneLog />);
        expect(document.body).toBeInTheDocument();
    });
});
