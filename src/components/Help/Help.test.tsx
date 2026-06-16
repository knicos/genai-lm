import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import Help from './Help';

describe('Help', () => {
    it('renders', ({ expect }) => {
        render(
            <Help message="help">
                <div>child</div>
            </Help>
        );
        expect(document.body).toBeInTheDocument();
    });
});
