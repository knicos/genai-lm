import { describe, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import Multinomial, { MULTINOMIAL_ANIMATION_DURATION } from './Multinomial';

const predictions = [
    { token: 1, text: 'a', probability: 0.6, start: 0, end: 0.6 },
    { token: 2, text: 'b', probability: 0.4, start: 0.6, end: 1.0 },
];

describe('Multinomial', () => {
    it('renders bars for each prediction', ({ expect }) => {
        const { container } = render(
            <Multinomial
                predictions={predictions}
                lineHeight={20}
                multinomialRand={null}
            />
        );

        expect(container.querySelectorAll('div').length).toBeGreaterThan(2);
    });

    it('settles animation when multinomial value is provided', ({ expect }) => {
        vi.useFakeTimers();
        vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
            return window.setTimeout(() => cb(performance.now() + MULTINOMIAL_ANIMATION_DURATION + 1), 0);
        });

        const { container, rerender } = render(
            <Multinomial
                predictions={predictions}
                lineHeight={20}
                multinomialRand={null}
                target={1}
            />
        );

        rerender(
            <Multinomial
                predictions={predictions}
                lineHeight={20}
                multinomialRand={0.3}
                target={1}
            />
        );

        act(() => {
            vi.runAllTimers();
        });

        expect(container.querySelector('[class*=target]')).toBeInTheDocument();
        vi.restoreAllMocks();
        vi.useRealTimers();
    });
});
