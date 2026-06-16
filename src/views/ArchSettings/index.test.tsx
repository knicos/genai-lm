import { describe, it } from 'vitest';
import renderWithContexts from '../../utilities/renderWithContexts';
import { Component as ArchSettings } from './index';

describe('ArchSettings view', () => {
    it('renders', ({ expect }) => {
        renderWithContexts(<ArchSettings />);
        expect(document.body).toBeInTheDocument();
    });
});
