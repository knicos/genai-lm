import style from './style.module.css';
import { ReactNode } from 'react';
import { CardItem } from '../CardRow/CardRow';

interface Props<T extends CardItem = CardItem> {
    coords: { top: number; left: number; width: number; height: number } | null;
    toClose: boolean;
    handleClose: () => void;
    onClick: (card: T) => void;
    card: T;
    content: ReactNode;
}

export default function ExpandedCard<T extends CardItem>({
    coords,
    toClose,
    handleClose,
    onClick,
    card,
    content,
}: Props<T>) {
    return (
        <div
            id={`expanded-card-${card.id}`}
            data-testid={`expanded-card-${card.id}`}
            className={`${style.expandedCard} ${toClose ? style.scaleOut : ''}`}
            style={{
                top: coords?.top,
                left: coords?.left,
                width: coords?.width,
                //height: coords?.height,
            }}
            onMouseLeave={handleClose}
            onClick={() => {
                onClick(card);
                handleClose();
            }}
        >
            {content}
        </div>
    );
}
