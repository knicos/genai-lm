import { describe, it } from 'vitest';
import renderWithContexts from '../../utilities/renderWithContexts';
import { Component as TokenisedData } from './index';

describe('TokenisedData view', () => {
    it('renders', ({ expect }) => {
        renderWithContexts(<TokenisedData />);
        expect(document.body).toBeInTheDocument();
    });
});
