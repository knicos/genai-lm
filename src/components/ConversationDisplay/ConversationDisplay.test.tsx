import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import ConversationDisplay from './ConversationDisplay';

describe('ConversationDisplay', () => {
    it('renders', ({ expect }) => {
        render(<ConversationDisplay conversation={[{ role: 'user', content: 'hello' }]} />);
        expect(document.body).toBeInTheDocument();
    });
});
