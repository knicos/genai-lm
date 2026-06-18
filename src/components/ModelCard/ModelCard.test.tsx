import { describe, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import ModelCard from './ModelCard';

describe('ModelCard', () => {
    it('renders', async ({ expect }) => {
        render(
            <ModelCard
                onSelect={() => {}}
                onHighlight={() => {}}
                card={{
                    id: 'card1',
                    title: 'Card 1',
                    sampleContent: 'SampleText',
                    size: 10,
                    url: '',
                    trained: true,
                    language: 'en',
                    conversational: false,
                    restricted: false,
                    tags: ['tag1', 'tag2'],
                    rating: 0,
                }}
            />
        );

        expect(screen.getByText('Card 1')).toBeInTheDocument();
        expect(screen.getByText('SampleText')).toBeInTheDocument();
    });
});
