import { useState } from 'react';
import style from './style.module.css';
import Downloader from '../../utilities/downloader';
import Card from '../Card/Card';
import SampleWriter from './SampleWriter';
import { IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import { DataManifestEntry } from '../../state/data';

interface Props {
    onSelect: (card: DataManifestEntry, downloader?: Downloader) => void;
    onHighlight: (id: string, close?: boolean) => void;
    highlighted?: boolean;
    disabled?: boolean;
    used?: boolean;
    card: DataManifestEntry;
}

export default function DataCard({ onSelect, onHighlight, used, card, highlighted, disabled }: Props) {
    const [downloader, setDownloader] = useState<Downloader | null>(null);
    const [done, setDone] = useState(false);

    const { title, sampleContent, complexity, size } = card;

    const fontSize = Math.max(0.7, Math.log(size) / Math.log(20));

    const handleDownload = () => {
        if (downloader) return;
        const d = Downloader.downloadFile(card.id, card.url, card.title, card.mime);
        setDone(true);
        setDownloader(d);
        onSelect(card, d);
    };

    return (
        <Card
            onSelect={onSelect}
            card={card}
            onHighlight={onHighlight}
            highlighted={highlighted}
            disabled={disabled}
            used={used || downloader !== null}
            onClick={handleDownload}
            expandedContent={
                <>
                    <div className={`${style.sampleBox} ${style[card.complexity]}`}>
                        <SampleWriter sample={sampleContent || ''} />
                        <div className={style.sizeIcon}>
                            <IconButton
                                color="secondary"
                                disabled={downloader !== null || done || used}
                                onClick={handleDownload}
                            >
                                {downloader || used ? (
                                    <CheckIcon
                                        fontSize="inherit"
                                        color="success"
                                    />
                                ) : (
                                    <AddIcon fontSize="inherit" />
                                )}
                            </IconButton>
                        </div>
                    </div>
                    <div className={style.buttonRow}>
                        <h2>{card.title}</h2>
                    </div>
                </>
            }
            content={
                <>
                    <div className={`${style.sampleBox} ${downloader || used ? style.disabledBG : style[complexity]}`}>
                        <div className={style.sampleText}>{sampleContent || ''}</div>
                        <div
                            className={style.sizeText}
                            style={{
                                fontSize: `${fontSize}rem`,
                                width: `${fontSize * 2}rem`,
                                height: `${fontSize * 2}rem`,
                            }}
                        >
                            {size >= 1 ? `${size}M` : `${size * 1000}K`}
                        </div>
                    </div>
                    <div className={style.buttonRow}>
                        <h2>{title}</h2>
                        {used || downloader ? (
                            <CheckIcon
                                fontSize="small"
                                color="success"
                            />
                        ) : null}
                    </div>
                </>
            }
        />
    );
}
