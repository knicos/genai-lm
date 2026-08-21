import { render, screen } from '@testing-library/react';
import { describe, it, vi } from 'vitest';
import TestWrapper from '../../utilities/TestWrapper';
import DeviceProbe from './DeviceProbe';

describe('DeviceProbe', () => {
    it('renders', async ({ expect }) => {
        render(<DeviceProbe />, { wrapper: TestWrapper });
        await vi.waitFor(async () => {
            expect(await screen.findByText('deviceProbe.probing')).not.toBeInTheDocument();
        });
    });
});
