import { useEffect, useRef, useState } from 'react';
import style from './style.module.css';
import { IconButton, Portal } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import CheckIcon from '@mui/icons-material/Check';
import Downloader from '../../utilities/downloader';

const EXPANDSIZE = 20;

export interface DataCardItem {
    id: string;
    title: string;
    sample: string;
    size: number;
    url: string;
    mime: string;
    lang: string;
    complexity: 'simple' | 'normal' | 'complex';
    instruct: boolean;
}

interface Props extends DataCardItem {
    onSelect: (card: DataCardItem, downloader: Downloader) => void;
    onHighlight: (id: string | null) => void;
    highlighted?: boolean;
    disabled?: boolean;
}

export default function DataCard({ onSelect, onHighlight, highlighted, disabled, ...card }: Props) {
    const [toClose, setToClose] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
    const [expanded, setExpanded] = useState(highlighted || false);
    const [downloader, setDownloader] = useState<Downloader | null>(null);
    const [done, setDone] = useState(false);
    const { title, sample, complexity, size } = card;

    const handleExpand = () => {
        onHighlight(card.id);
    };

    const handleClose = () => {
        onHighlight(null);
    };

    useEffect(() => {
        if (highlighted) {
            const timeout = setTimeout(() => {
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
            }, 500);
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

    return (
        <>
            <div
                className={`${style.dataCard} ${disabled ? style.disabled : ''}`}
                role="button"
                onClick={!disabled ? handleExpand : undefined}
                onMouseEnter={!disabled ? handleExpand : undefined}
                onMouseLeave={!disabled && !expanded ? handleClose : undefined}
                ref={cardRef}
            >
                <div className={`${style.sampleBox} ${style[complexity]}`}>
                    <div className={style.sampleText}>{sample}</div>
                    <div className={style.sizeText}>{size}M</div>
                </div>
                <h2>{title}</h2>
            </div>
            {expanded && (
                <Portal container={() => document.getElementById('root') || document.body}>
                    <div
                        className={`${style.expandedCard} ${toClose ? style.scaleOut : ''}`}
                        style={{
                            top: coords?.top,
                            left: coords?.left,
                            width: coords?.width,
                            height: coords?.height,
                        }}
                        onMouseLeave={handleClose}
                    >
                        <div className={style.sampleText}>{sample}</div>
                        <IconButton
                            size="large"
                            color="secondary"
                            disabled={downloader !== null}
                            onClick={() => {
                                const downloader = Downloader.downloadFile(card.url, card.title, card.mime);
                                downloader.on('end', () => setDone(true));
                                setDownloader(downloader);
                                onSelect(card, downloader);
                            }}
                        >
                            {done ? <CheckIcon fontSize="large" /> : <DownloadIcon fontSize="large" />}
                        </IconButton>
                    </div>
                </Portal>
            )}
        </>
    );
}
