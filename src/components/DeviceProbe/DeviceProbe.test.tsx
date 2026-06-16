import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import TestWrapper from '../../utilities/TestWrapper';
import DeviceProbe from './DeviceProbe';

describe('DeviceProbe', () => {
    it('renders', ({ expect }) => {
        render(<DeviceProbe />, { wrapper: TestWrapper });
        expect(document.body).toBeInTheDocument();
    });
});
