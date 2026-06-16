import { describe, it } from 'vitest';
import renderWithContexts from '../../utilities/renderWithContexts';
import { Component as TrainingSettings } from './index';

describe('TrainingSettings view', () => {
    it('renders', ({ expect }) => {
        renderWithContexts(<TrainingSettings />);
        expect(document.body).toBeInTheDocument();
    });
});
