import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import ScoreGauge from './ScoreGauge';

describe('ScoreGauge', () => {
    it('renders', ({ expect }) => {
        render(
            <ScoreGauge
                value={0.5}
                maxValue={1}
            />
        );
        expect(document.body).toBeInTheDocument();
    });
});