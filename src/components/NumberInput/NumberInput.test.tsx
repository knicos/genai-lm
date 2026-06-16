import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import NumberInput from './NumberInput';

describe('NumberInput', () => {
    it('renders', ({ expect }) => {
        render(
            <NumberInput
                value={5}
                onChange={() => {}}
                min={0}
                max={10}
                label="num"
            />
        );
        expect(document.body).toBeInTheDocument();
    });
});
