import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import ChatPromptInput from './ChatPromptInput';

describe('ChatPromptInput', () => {
    it('renders', ({ expect }) => {
        render(<ChatPromptInput onSend={() => {}} />);
        expect(document.body).toBeInTheDocument();
    });
});
