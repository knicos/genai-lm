import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import CircularProgress from './CircularProgress';

describe('CircularProgress', () => {
    it('renders', ({ expect }) => {
        render(
            <CircularProgress
                radius={24}
                step={1}
                totalSteps={6}
            />
        );
        expect(document.body).toBeInTheDocument();
    });
});
