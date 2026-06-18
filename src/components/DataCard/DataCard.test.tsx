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
                    sampleContent: 'SampleText',
                    size: 10,
                    url: '',
                    mime: 'text/plain',
                    language: 'en',
                    complexity: 'low',
                    conversational: false,
                    restricted: false,
                    modality: 'text',
                    tags: ['tag1', 'tag2'],
                    rating: 0,
                }}
            />
        );

        expect(screen.getByText('Card 1')).toBeInTheDocument();
        expect(screen.getByText('SampleText')).toBeInTheDocument();
    });
});
