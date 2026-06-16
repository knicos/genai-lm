import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import CardView from './CardView';
import { CardComponentProps, CardItem } from '../CardRow/CardRow';

function MinimalCard({ card }: CardComponentProps<CardItem>) {
    return <div>{card.id}</div>;
}

describe('CardView', () => {
    it('renders', ({ expect }) => {
        render(
            <CardView
                data={[{ title: 'row', cards: [{ id: '1' }] }]}
                onSelect={() => {}}
                CardComponent={MinimalCard}
            />
        );
        expect(document.body).toBeInTheDocument();
    });
});
