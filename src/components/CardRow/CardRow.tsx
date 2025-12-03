import { ComponentType, useCallback, useEffect, useRef, useState } from 'react';
import style from './style.module.css';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

export interface CardItem {
    id: string;
}

export interface RowSet<T extends CardItem = CardItem> {
    title: string;
    cards: T[];
}

export interface CardComponentProps<T extends CardItem = CardItem, S = void> {
    onSelect: (card: T, extra?: S) => void;
    onHighlight: (id: string, close?: boolean) => void;
    highlighted?: boolean;
    disabled?: boolean;
    used?: boolean;
    card: T;
}

interface Props<T extends CardItem = CardItem, S = void> extends RowSet<T> {
    onSelect: (card: T, extra?: S) => void;
    selectedSet?: Set<string>;
    CardComponent: ComponentType<CardComponentProps<T, S>>;
}

export default function CardRow<T extends CardItem, S = void>({
    title,
    cards,
    onSelect,
    selectedSet,
    CardComponent,
}: Props<T, S>) {
    const [highlighted, setHighlighted] = useState<string | null>(null);
    const [width, setWidth] = useState(0);
    const listRef = useRef<HTMLUListElement>(null);
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        if (listRef.current) {
            setWidth(listRef.current.getBoundingClientRect().width);
        }
    }, []);

    const numVisible = Math.floor((width + 20) / 320);
    const hasLeftArrow = numVisible > 1 && offset > 0;
    const hasRightArrow = numVisible > 1 && offset + numVisible < cards.length;

    const handleOffsetChange = (newOffset: number) => {
        setOffset((o) => Math.max(0, Math.min(cards.length - numVisible, o + newOffset)));
        setHighlighted(null);
    };

    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTo({ left: offset * 320, behavior: 'smooth' });
        }
    }, [offset]);

    const handleHighlight = useCallback((id: string, close?: boolean) => {
        setHighlighted((old) => {
            if (!close) return id;
            if (old === id && close) return null;
            return old;
        });
    }, []);

    return (
        <div className={style.dataCardRow}>
            <h1>{title}</h1>
            <div className={numVisible > 1 ? style.container : style.columnContainer}>
                <ul ref={listRef}>
                    {cards.map((card, ix) => (
                        <li key={card.id}>
                            <CardComponent
                                card={card}
                                disabled={numVisible > 1 ? ix < offset || ix >= offset + numVisible : false}
                                used={selectedSet ? selectedSet.has(card.id) : false}
                                onSelect={onSelect}
                                onHighlight={handleHighlight}
                                highlighted={highlighted === card.id}
                            />
                        </li>
                    ))}
                </ul>
                {hasLeftArrow && (
                    <button
                        type="button"
                        className={`${style.arrow} ${style.left}`}
                        onClick={() => handleOffsetChange(-1)}
                    >
                        <ArrowBackIosNewIcon fontSize="inherit" />
                    </button>
                )}
                {hasRightArrow && (
                    <button
                        type="button"
                        className={`${style.arrow} ${style.right}`}
                        onClick={() => handleOffsetChange(1)}
                    >
                        <ArrowForwardIosIcon fontSize="inherit" />
                    </button>
                )}
            </div>
        </div>
    );
}
