import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import ModeSwitch from './ModeSwitch';

describe('ModeSwitch', () => {
    it('renders', ({ expect }) => {
        render(
            <ModeSwitch
                mode={false}
                setMode={() => {}}
                startLabel="A"
                endLabel="B"
            />
        );
        expect(document.body).toBeInTheDocument();
    });
});
