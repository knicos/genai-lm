import { ComponentType } from 'react';
import CardRow, { CardComponentProps, CardItem, RowSet } from '../CardRow/CardRow';
import style from './style.module.css';

interface Props<T extends CardItem = CardItem, S = void> {
    selectedSet?: Set<string>;
    data: RowSet<T>[];
    onSelect: (card: T, extra?: S) => void;
    CardComponent: ComponentType<CardComponentProps<T, S>>;
}

export default function CardView<T extends CardItem, S = void>({
    data,
    onSelect,
    selectedSet,
    CardComponent,
}: Props<T, S>) {
    return (
        <ul className={style.dataCardView}>
            {data.map((row) => (
                <li key={row.title}>
                    <CardRow
                        {...row}
                        onSelect={onSelect}
                        selectedSet={selectedSet}
                        CardComponent={CardComponent}
                    />
                </li>
            ))}
        </ul>
    );
}
