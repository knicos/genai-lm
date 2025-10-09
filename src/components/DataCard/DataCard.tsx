import { PointerEvent, useEffect, useRef, useState } from 'react';
import style from './style.module.css';
import { Portal } from '@mui/material';
import Downloader from '../../utilities/downloader';
import ExpandedCard from './ExpandedCard';
import { DataCardItem } from './type';

const EXPANDSIZE = 40;
const EXPAND_DELAY = 800;

interface Props extends DataCardItem {
    onSelect: (card: DataCardItem, downloader: Downloader) => void;
    onHighlight: (id: string, close?: boolean) => void;
    highlighted?: boolean;
    disabled?: boolean;
    used?: boolean;
}

export default function DataCard({ onSelect, onHighlight, highlighted, disabled, used, ...card }: Props) {
    const [toClose, setToClose] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
    const [expanded, setExpanded] = useState(highlighted || false);
    const [downloader, setDownloader] = useState<Downloader | null>(null);
    const [done, setDone] = useState(false);
    const touchRef = useRef(false);
    const { title, sample, complexity, size, id } = card;

    const handleExpand = () => {
        onHighlight(card.id);
    };

    const handleClose = () => {
        onHighlight(id, true);
    };

    useEffect(() => {
        if (highlighted && !downloader) {
            const timeout = setTimeout(
                () => {
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
    }, [highlighted, downloader]);

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

    const fontSize = Math.max(0.7, Math.log(size) / Math.log(20));

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
                                  if (downloader) return;
                                  const d = Downloader.downloadFile(card.id, card.url, card.title, card.mime);
                                  d.on('end', () => setDone(true));
                                  setDownloader(d);
                                  onSelect(card, d);
                              }
                          }
                        : undefined
                }
                onMouseEnter={!disabled && !used ? handleExpand : undefined}
                onMouseLeave={!disabled && !used && !expanded ? handleClose : undefined}
                ref={cardRef}
            >
                <div className={`${style.sampleBox} ${downloader || used ? style.disabledBG : style[complexity]}`}>
                    <div className={style.sampleText}>{sample}</div>
                    <div
                        className={style.sizeText}
                        style={{ fontSize: `${fontSize}rem`, width: `${fontSize * 2}rem` }}
                    >
                        {size >= 1 ? `${size}M` : `${size * 1000}K`}
                    </div>
                </div>
                <h2>{title}</h2>
            </div>
            {expanded && (
                <Portal container={() => document.getElementById('root') || document.body}>
                    <ExpandedCard
                        coords={coords}
                        toClose={toClose}
                        downloader={downloader}
                        done={done}
                        handleClose={handleClose}
                        onSelect={onSelect}
                        setDownloader={setDownloader}
                        setDone={setDone}
                        card={card}
                    />
                </Portal>
            )}
        </>
    );
}
