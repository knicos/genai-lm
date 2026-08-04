import { describe, it } from 'vitest';
import { inferenceSteps, trainingSteps } from './animationSteps';
import { GPTConfig } from '@genai-fi/nanogpt';

describe('animationSteps', () => {
    it('builds inference steps with expected sequence', ({ expect }) => {
        const steps = inferenceSteps({ nLayer: 3 } as GPTConfig);
        expect(steps[0].name).toBe('next');
        expect(steps[1].name).toBe('tokenise');
        expect(steps[2].name).toBe('predict');
        expect(steps[steps.length - 2].name).toBe('updating');
        expect(steps[steps.length - 1].name).toBe('done');
    });

    it('builds training steps with slower updating multiplier', ({ expect }) => {
        const steps = trainingSteps({ nLayer: 2 } as GPTConfig);
        const updating = steps.find((s) => s.name === 'updating');
        expect(updating?.multiplier).toBe(10);
    });
});
