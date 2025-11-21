import { describe, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SidePanel from './SidePanel';

describe('SidePanel', () => {
    it('renders closed', async ({ expect }) => {
        render(
            <SidePanel
                open={false}
                onClose={() => {}}
            >
                Side Panel Content
            </SidePanel>
        );
        expect(screen.queryByText('Side Panel Content')).not.toBeVisible();
    });

    it('renders open', async ({ expect }) => {
        render(
            <SidePanel
                open={true}
                onClose={() => {}}
            >
                Side Panel Content
            </SidePanel>
        );
        expect(screen.getByText('Side Panel Content')).toBeVisible();
    });

    it('can be closed via onClose', async ({ expect }) => {
        const user = userEvent.setup();
        const onCloseMock = vi.fn();
        render(
            <SidePanel
                open={true}
                onClose={onCloseMock}
            >
                Side Panel Content
            </SidePanel>
        );

        const closeButton = screen.getByTestId('sidepanel-close-button');
        await user.click(closeButton);

        expect(onCloseMock).toHaveBeenCalled();
    });

    it('can be resized', async ({ expect }) => {
        const user = userEvent.setup();
        render(
            <SidePanel
                open={true}
                onClose={() => {}}
            >
                Side Panel Content
            </SidePanel>
        );

        const resizer = screen.getByRole('separator', { name: 'Resize sidebar' });
        const initialWidth = resizer.getAttribute('aria-valuenow');

        // Simulate key press to resize
        await user.click(resizer);
        await user.keyboard('{ArrowLeft}{ArrowLeft}');

        const newWidth = resizer.getAttribute('aria-valuenow');
        expect(Number(newWidth)).toBeGreaterThan(Number(initialWidth));
    });
});
