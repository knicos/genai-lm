import { describe, it } from 'vitest';
import renderWithContexts from '../../utilities/renderWithContexts';
import { Component as GeneratorSettings } from './index';

describe('GeneratorSettings view', () => {
    it('renders', ({ expect }) => {
        renderWithContexts(<GeneratorSettings />);
        expect(document.body).toBeInTheDocument();
    });
});
