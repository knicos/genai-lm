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
                    name: 'Card 1',
                    example: 'SampleText',
                    parameters: 10,
                    url: '',
                    trained: true,
                }}
            />
        );

        expect(screen.getByText('Card 1')).toBeInTheDocument();
        expect(screen.getByText('SampleText')).toBeInTheDocument();
    });
});
