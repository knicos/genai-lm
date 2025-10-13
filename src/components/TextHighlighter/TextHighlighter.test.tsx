import { describe, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TextHighlighter from './TextHighlighter';

describe('TextHighlighter', () => {
    it('shows plain text', async ({ expect }) => {
        render(
            <TextHighlighter
                mode="plain"
                text="test text string"
            />
        );

        expect(screen.getByText('test text string')).toBeVisible();
        expect(screen.getByTestId('cursor')).toBeVisible();
    });

    it('allows for editing', async ({ expect }) => {
        const user = userEvent.setup();
        const onChange = vi.fn();

        render(
            <TextHighlighter
                mode="edit"
                text="test string"
                onChange={onChange}
            />
        );

        await user.click(screen.getByTestId('input-box'));
        await user.keyboard('hello');

        expect(onChange).toHaveBeenCalledWith('hello');
    });
});
