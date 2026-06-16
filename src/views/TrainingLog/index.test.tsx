import { describe, it } from 'vitest';
import renderWithContexts from '../../utilities/renderWithContexts';
import { Component as TrainingLog } from './index';

describe('TrainingLog view', () => {
    it('renders', ({ expect }) => {
        renderWithContexts(<TrainingLog />);
        expect(document.body).toBeInTheDocument();
    });
});
