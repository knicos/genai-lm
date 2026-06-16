import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import NumberBox from './NumberBox';

describe('NumberBox', () => {
    it('renders', ({ expect }) => {
        render(
            <NumberBox
                value={5}
                label="value"
            />
        );
        expect(document.body).toBeInTheDocument();
    });
});
