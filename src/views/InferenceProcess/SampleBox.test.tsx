import { beforeAll, describe, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SampleBox from './SampleBox';

const tokeniser = {
    decode: vi.fn((tokens: number[]) => tokens.map((t) => String.fromCharCode(97 + t)).join('')),
    getVocab: vi.fn(() => ['a', 'b', 'c', 'd', 'e']),
} as const;

beforeAll(() => {
    Element.prototype.scroll = () => {};
});

describe('SampleBox', () => {
    it('decodes sample text when no selected token index is provided', ({ expect }) => {
        render(
            <SampleBox
                sampleTokens={[0, 1, 2]}
                tokeniser={tokeniser as never}
                attention={null}
            />
        );

        expect(screen.getByText('abc')).toBeInTheDocument();
    });

    it('renders token chips when showTokens is enabled', ({ expect }) => {
        const { container } = render(
            <SampleBox
                sampleTokens={[0, 1, 2]}
                tokeniser={tokeniser as never}
                attention={[1, 0.5, 0.25]}
                showTokens
            />
        );

        expect(container.querySelectorAll('span').length).toBeGreaterThan(2);
    });

    it('shows selected token answer and post text', ({ expect }) => {
        render(
            <SampleBox
                sampleTokens={[0, 1, 2, 3]}
                tokeniser={tokeniser as never}
                attention={null}
                selectedTokenIndex={1}
                showAnswer
            />
        );

        expect(screen.getByText('b')).toBeInTheDocument();
        expect(screen.getByText('cd')).toBeInTheDocument();
    });
});
