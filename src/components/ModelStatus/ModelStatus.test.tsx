import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import ModelStatus from './ModelStatus';

describe('ModelStatus', () => {
    it('renders', ({ expect }) => {
        render(
            <ModelStatus
                show={false}
                onClose={() => {}}
            />
        );
        expect(document.body).toBeInTheDocument();
    });
});
