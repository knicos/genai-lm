import { describe, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import DataCard from './DataCard';

describe('DataCard', () => {
    it('renders', async ({ expect }) => {
        render(
            <DataCard
                onSelect={() => {}}
                onHighlight={() => {}}
                card={{
                    id: 'card1',
                    title: 'Card 1',
                    sample: 'SampleText',
                    size: 10,
                    url: '',
                    originURL: '',
                    mime: 'text/plain',
                    lang: 'en',
                    complexity: 'simple',
                    instruct: false,
                    author: '',
                }}
            />
        );

        expect(screen.getByText('Card 1')).toBeInTheDocument();
        expect(screen.getByText('SampleText')).toBeInTheDocument();
    });
});
