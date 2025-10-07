import { useCallback, useEffect, useRef, useState } from 'react';
import DataCard from '../DataCard/DataCard';
import style from './style.module.css';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import Downloader from '../../utilities/downloader';
import { DataCardItem } from '../DataCard/type';

export interface DataRowSet {
    title: string;
    cards: DataCardItem[];
}

interface Props extends DataRowSet {
    onSelect: (card: DataCardItem, downloader: Downloader) => void;
    selectedSet?: Set<string>;
}

export default function DataCardRow({ title, cards, onSelect, selectedSet }: Props) {
    const [highlighted, setHighlighted] = useState<string | null>(null);
    const [width, setWidth] = useState(0);
    const listRef = useRef<HTMLUListElement>(null);
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setWidth(entry.contentRect.width);
            }
        });
        if (listRef.current) {
            observer.observe(listRef.current);
            setWidth(listRef.current.getBoundingClientRect().width);
        }
        return () => observer.disconnect();
    }, []);

    const numVisible = Math.floor((width + 20) / 320);
    const hasLeftArrow = offset > 0;
    const hasRightArrow = offset + numVisible < cards.length;

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
            <div className={style.container}>
                <ul ref={listRef}>
                    {cards.map((card, ix) => (
                        <li key={card.url}>
                            <DataCard
                                {...card}
                                disabled={ix < offset || ix >= offset + numVisible}
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
