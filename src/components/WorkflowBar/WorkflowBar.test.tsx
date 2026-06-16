import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import WorkflowBar from './WorkflowBar';

describe('WorkflowBar', () => {
    it('renders', ({ expect }) => {
        render(
            <MemoryRouter>
                <WorkflowBar items={[{ id: 'model', status: 'available' }]} />
            </MemoryRouter>
        );
        expect(document.body).toBeInTheDocument();
    });
});
