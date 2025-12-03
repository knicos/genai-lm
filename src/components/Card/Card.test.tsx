import { render, screen } from '@testing-library/react';
import { describe, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import Card from './Card';

describe('Card', () => {
    it('renders', async ({ expect }) => {
        render(
            <Card
                onSelect={() => {}}
                onHighlight={() => {}}
                onClick={() => {}}
                card={{ id: '1', name: 'Test' }}
                content="Test Content"
                expandedContent="Expanded"
            />
        );

        expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('expands when highlighted', async ({ expect }) => {
        render(
            <Card
                onSelect={() => {}}
                onHighlight={() => {}}
                highlighted
                onClick={() => {}}
                card={{ id: '1', name: 'Test' }}
                content="Test Content"
                expandedContent="Expanded"
            />
        );

        expect(await screen.findByText('Expanded')).toBeInTheDocument();
    });

    it('selects on click', async ({ expect }) => {
        const user = userEvent.setup();
        const handleClick = vi.fn();
        render(
            <Card
                onSelect={() => {}}
                onHighlight={() => {}}
                onClick={handleClick}
                card={{ id: '1', name: 'Test' }}
                content="Test Content"
                expandedContent="Expanded"
            />
        );

        await user.click(screen.getByTestId('card-1'));
        expect(handleClick).toHaveBeenCalled();
    });

    it('expands on hover', async ({ expect }) => {
        const user = userEvent.setup();
        const handleHighlight = vi.fn();
        render(
            <Card
                onSelect={() => {}}
                onHighlight={handleHighlight}
                onClick={() => {}}
                card={{ id: '1', name: 'Test' }}
                content="Test Content"
                expandedContent="Expanded"
            />
        );

        await user.hover(screen.getByTestId('card-1'));
        expect(handleHighlight).toHaveBeenCalledWith('1');
    });

    it('selects on expanded click', async ({ expect }) => {
        const user = userEvent.setup();
        const handleClick = vi.fn();
        const handleHighlight = vi.fn();
        render(
            <Card
                onSelect={() => {}}
                onHighlight={handleHighlight}
                onClick={handleClick}
                card={{ id: '1', name: 'Test' }}
                content="Test Content"
                expandedContent="Expanded"
                highlighted
            />
        );

        await user.click(screen.getByTestId('card-1'));
        expect(handleClick).toHaveBeenCalled();
    });
});
