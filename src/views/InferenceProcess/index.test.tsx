import { describe, it } from 'vitest';
import renderWithContexts from '../../utilities/renderWithContexts';
import { Component as InferenceProcess } from './index';

describe('InferenceProcess view', () => {
    it('renders', ({ expect }) => {
        renderWithContexts(<InferenceProcess />);
        expect(document.body).toBeInTheDocument();
    });
});
