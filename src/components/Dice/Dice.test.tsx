import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import Dice from './Dice';

describe('Dice', () => {
    it('renders', ({ expect }) => {
        render(<Dice value={3} />);
        expect(document.body).toBeInTheDocument();
    });
});
