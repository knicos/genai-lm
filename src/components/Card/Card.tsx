import { PointerEvent, ReactNode, useEffect, useRef, useState } from 'react';
import style from './style.module.css';
import { CardItem } from '../CardRow/CardRow';

const EXPAND_DELAY = 100;

interface Props<T extends CardItem = CardItem, S = void> {
    onSelect: (card: T, extra?: S) => void;
    onHighlight: (id: string, close?: boolean) => void;
    highlighted?: boolean;
    disabled?: boolean;
    used?: boolean;
    card: T;
    content: ReactNode;
    expandedContent: ReactNode;
    onClick: (card: T) => void;
}

export default function Card<T extends CardItem, S = void>({
    onHighlight,
    expandedContent,
    onClick,
    content,
    highlighted,
    disabled,
    used,
    card,
}: Props<T, S>) {
    const [toClose, setToClose] = useState(false);
    const [expanded, setExpanded] = useState(highlighted || false);
    const touchRef = useRef(false);
    const usedRef = useRef(used);
    usedRef.current = used;

    const { id } = card;

    const handleExpand = () => {
        onHighlight(card.id);
    };

    const handleClose = () => {
        onHighlight(id, true);
    };

    useEffect(() => {
        if (highlighted) {
            const timeout = setTimeout(
                () => {
                    if (usedRef.current) return;
                    setToClose(false);
                    setExpanded(true);
                },
                touchRef.current ? 0 : EXPAND_DELAY
            );
            return () => clearTimeout(timeout);
        } else {
            setToClose(true);
        }
    }, [highlighted]);

    useEffect(() => {
        if (toClose) {
            const timeout = setTimeout(() => {
                setToClose(false);
                setExpanded(false);
            }, 100);
            return () => clearTimeout(timeout);
        }
    }, [toClose]);

    useEffect(() => {
        if (expanded && touchRef.current) {
            const handleGlobalPointerDown = (e: PointerEvent | MouseEvent | TouchEvent) => {
                // If the expanded card exists and the click/touch is outside, close it
                const expandedCardEl = document.getElementById(`expanded-card-${id}`);
                if (expandedCardEl && !expandedCardEl.contains(e.target as Node)) {
                    onHighlight(id, true);
                }
            };

            document.addEventListener('pointerdown', handleGlobalPointerDown);
            document.addEventListener('touchstart', handleGlobalPointerDown);

            return () => {
                document.removeEventListener('pointerdown', handleGlobalPointerDown);
                document.removeEventListener('touchstart', handleGlobalPointerDown);
            };
        }
    }, [expanded, toClose, onHighlight, id]);

    return (
        <>
            <div
                className={`${style.dataCard} ${disabled ? style.disabled : ''}`}
                role="button"
                onPointerUp={
                    !disabled && !used
                        ? (e: PointerEvent) => {
                              if (e.pointerType === 'touch' || e.pointerType === 'pen') {
                                  touchRef.current = true;
                                  handleExpand();
                              } else {
                                  onClick(card);
                              }
                          }
                        : undefined
                }
                onMouseEnter={!disabled && !used ? handleExpand : undefined}
                onMouseLeave={!disabled && !used ? handleClose : undefined}
                data-testid={`card-${card.id}`}
            >
                {expanded ? expandedContent : content}
            </div>
        </>
    );
}
