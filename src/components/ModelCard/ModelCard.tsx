import { MouseEvent, useState } from 'react';
import style from './style.module.css';
import Card from '../Card/Card';
import { CircularProgress, IconButton } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import CheckIcon from '@mui/icons-material/Check';
import ModelInfo from '../ModelInfo/ModelInfo';
import Downloader from '../../utilities/downloader';
import SampleWriter from '../DataCard/SampleWriter';
import ParameterGrid from './NumberGrid';
import { ModelManifestEntry } from '../../state/model';

interface Props {
    onSelect: (card: ModelManifestEntry, downloader?: Downloader) => void;
    onHighlight: (id: string, close?: boolean) => void;
    highlighted?: boolean;
    disabled?: boolean;
    used?: boolean;
    card: ModelManifestEntry;
}

export default function ModelCard({ onSelect, onHighlight, used, card, highlighted, disabled }: Props) {
    const [downloader, setDownloader] = useState<Downloader | null>(null);
    const [done, setDone] = useState(false);

    const { title, size } = card;

    const fontSize = Math.max(0.7, Math.log(size) / Math.log(40));
    const hasTrainingStats = false;

    const handleCreateModel = () => {
        if (card.url) {
            const newDownload = Downloader.downloadFile(card.id, card.url, card.title, 'application/zip');
            setDownloader(newDownload);
            newDownload.on('end', () => {
                setDone(true);
                setDownloader(null);
            });
            newDownload.on('error', () => {
                setDownloader(null);
            });
            newDownload.on('cancel', () => {
                setDownloader(null);
            });
            onSelect(card, newDownload);
        } else {
            onSelect(card);
            setDone(true);
        }
    };

    const isNone = card.id === 'none';

    const density = size < 3 ? 'small' : size < 8 ? 'medium' : size < 20 ? 'large' : 'xlarge';

    return (
        <Card
            onSelect={onSelect}
            card={card}
            onHighlight={onHighlight}
            highlighted={highlighted}
            disabled={disabled}
            used={used || downloader !== null}
            onClick={handleCreateModel}
            expandedContent={
                <>
                    <div
                        className={`${style.sampleBox} ${isNone ? style.noneCard : card.trained ? style.trained : style.untrained} ${style[density]}`}
                    >
                        {card.sampleContent && <SampleWriter sample={card.sampleContent} />}
                        {!isNone && (
                            <div className={style.sizeIcon}>
                                <IconButton
                                    color="secondary"
                                    disabled={downloader !== null}
                                    onClick={(e: MouseEvent) => {
                                        e.stopPropagation();
                                        handleCreateModel();
                                    }}
                                >
                                    {downloader && !done ? (
                                        <CircularProgress />
                                    ) : done || used ? (
                                        <CheckIcon
                                            fontSize="inherit"
                                            color="success"
                                        />
                                    ) : (
                                        <DownloadIcon fontSize="inherit" />
                                    )}
                                </IconButton>
                            </div>
                        )}
                        {!card.sampleContent && (
                            <ParameterGrid
                                density={density}
                                seed={card.id}
                                fillScale={Math.max(0.8, Math.min(1.2, Math.log10(size + 10) / 3))}
                            />
                        )}
                        <div className={style.infoContainer}>
                            {!isNone && (
                                <ModelInfo
                                    config={card.config || {}}
                                    tokeniser={(card.config?.vocabSize || 0) > 256 ? 'bpe' : 'char'}
                                    showTokens={!hasTrainingStats}
                                    showLayers={!hasTrainingStats}
                                    showDuration={hasTrainingStats}
                                    showSamples={hasTrainingStats}
                                />
                            )}
                        </div>
                    </div>
                    <div className={style.buttonRow}>
                        <h2>{card.title}</h2>
                    </div>
                </>
            }
            content={
                <>
                    <div
                        className={`${style.sampleBox} ${
                            isNone
                                ? style.noneCard
                                : downloader || used
                                  ? style.disabledBG
                                  : card.trained
                                    ? style.trained
                                    : style.untrained
                        } ${style[density]}`}
                    >
                        {card.sampleContent && <SampleWriter sample={card.sampleContent} />}
                        {!card.sampleContent && (
                            <ParameterGrid
                                density={density}
                                seed={card.id}
                                fillScale={Math.max(0.8, Math.min(1.2, Math.log10(size + 10) / 3))}
                            />
                        )}
                        {!isNone && (
                            <div
                                className={style.sizeText}
                                style={{ fontSize: `${fontSize}rem`, width: `${fontSize * 2.3}rem` }}
                            >
                                {size >= 1000
                                    ? `${Math.round(size / 1000)}B`
                                    : size >= 1
                                      ? `${Math.round(size)}M`
                                      : `${size * 1000}K`}
                            </div>
                        )}
                    </div>
                    <div className={style.buttonRow}>
                        <h2>{title}</h2>
                    </div>
                </>
            }
        />
    );
}
