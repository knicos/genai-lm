import { PointerEvent, ReactNode, useEffect, useRef, useState } from 'react';
import style from './style.module.css';
import { Portal } from '@mui/material';
import ExpandedCard from './ExpandedCard';
import { CardItem } from '../CardRow/CardRow';

const EXPANDSIZE = 40;
const EXPAND_DELAY = 800;

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
    const cardRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
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
                    if (cardRef.current) {
                        const rect = cardRef.current.getBoundingClientRect();
                        setCoords({
                            top: rect.top - EXPANDSIZE,
                            left: rect.left - EXPANDSIZE,
                            width: rect.width + EXPANDSIZE * 2,
                            height: rect.height + EXPANDSIZE * 2,
                        });
                    }
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
            }, 400);
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
                onMouseLeave={!disabled && !used && !expanded ? handleClose : undefined}
                ref={cardRef}
                data-testId={`card-${card.id}`}
            >
                {content}
            </div>
            {expanded && (
                <Portal container={() => document.getElementById('root') || document.body}>
                    <ExpandedCard
                        coords={coords}
                        toClose={toClose}
                        handleClose={handleClose}
                        card={card}
                        content={expandedContent}
                        onClick={onClick}
                    />
                </Portal>
            )}
        </>
    );
}
