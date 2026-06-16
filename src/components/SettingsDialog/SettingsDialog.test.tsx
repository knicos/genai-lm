import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import SettingsDialog from './SettingsDialog';

describe('SettingsDialog', () => {
    it('renders', ({ expect }) => {
        render(
            <MemoryRouter>
                <SettingsDialog />
            </MemoryRouter>
        );
        expect(document.body).toBeInTheDocument();
    });
});
