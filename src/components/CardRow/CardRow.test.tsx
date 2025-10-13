import { render, screen } from '@testing-library/react';
import { describe, it } from 'vitest';
import CardRow from './CardRow';

interface Props {
    onSelect: (card: { id: string; name: string }) => void;
    onHighlight: (id: string, close?: boolean) => void;
    highlighted?: boolean;
    disabled?: boolean;
    used?: boolean;
    card: { id: string; name: string };
}

function TestCard({ card }: Props) {
    return <div id={`card-${card.id}`}>{card.name}</div>;
}

describe('CardRow', () => {
    it('renders two cards', async ({ expect }) => {
        render(
            <CardRow<{ id: string; name: string }>
                title="TestTitle"
                cards={[
                    { id: '1', name: 'One' },
                    { id: '2', name: 'Two' },
                ]}
                onSelect={() => {}}
                CardComponent={TestCard}
            />
        );
        expect(screen.getByText('One')).toBeInTheDocument();
        expect(screen.getByText('Two')).toBeInTheDocument();
        expect(screen.getByText('TestTitle')).toBeInTheDocument();
    });
});
