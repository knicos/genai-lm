import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import { MemoryRouter } from 'react-router';
import AppBar from './AppBar';

describe('AppBar', () => {
    it('renders', ({ expect }) => {
        render(
            <MemoryRouter>
                <AppBar sidepanel="" />
            </MemoryRouter>
        );
        expect(document.body).toBeInTheDocument();
    });
});
