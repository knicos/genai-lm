import { describe, it } from 'vitest';
import renderWithContexts from '../../utilities/renderWithContexts';
import { Component as ChatApp } from './index';

describe('ChatApp view', () => {
    it('renders', ({ expect }) => {
        renderWithContexts(<ChatApp />);
        expect(document.body).toBeInTheDocument();
    });
});
