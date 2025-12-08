import { MouseEvent, useState } from 'react';
import style from './style.module.css';
import { ModelCardItem } from './type';
import Card from '../Card/Card';
import { CircularProgress, IconButton } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import CheckIcon from '@mui/icons-material/Check';
import ModelInfo from '../ModelInfo/ModelInfo';
import Downloader from '../../utilities/downloader';
import SampleWriter from '../DataCard/SampleWriter';

interface Props {
    onSelect: (card: ModelCardItem, downloader?: Downloader) => void;
    onHighlight: (id: string, close?: boolean) => void;
    highlighted?: boolean;
    disabled?: boolean;
    used?: boolean;
    card: ModelCardItem;
}

export default function ModelCard({ onSelect, onHighlight, used, card, highlighted, disabled }: Props) {
    const [downloader, setDownloader] = useState<Downloader | null>(null);
    const [done, setDone] = useState(false);

    const { name, parameters } = card;

    const fontSize = Math.max(0.7, Math.log(parameters) / Math.log(20));
    const hasTrainingStats = !!card.trainingStats && card.trained;

    const handleCreateModel = () => {
        if (card.url) {
            const newDownload = Downloader.downloadFile(card.id, card.url, card.name, 'application/zip');
            setDownloader(newDownload);
            newDownload.on('end', () => {
                setDone(true);
                setDownloader(null);
            });
            onSelect(card, newDownload);
        } else {
            onSelect(card);
            setDone(true);
        }
    };

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
                    <div className={`${style.sampleBox} ${card.trained ? style.trained : style.untrained}`}>
                        {card.example && <SampleWriter sample={card.example} />}
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
                        <div className={style.infoContainer}>
                            <ModelInfo
                                config={card.config || {}}
                                tokeniser={card.tokeniser || 'char'}
                                showTokens={!hasTrainingStats}
                                showLayers={!hasTrainingStats}
                                showContextSize={!hasTrainingStats}
                                trainingStats={hasTrainingStats ? card.trainingStats : undefined}
                                showDuration={hasTrainingStats}
                                showSamples={hasTrainingStats}
                            />
                        </div>
                    </div>
                    <div className={style.buttonRow}>
                        <h2>{card.name}</h2>
                    </div>
                </>
            }
            content={
                <>
                    <div
                        className={`${style.sampleBox} ${
                            downloader || used ? style.disabledBG : card.trained ? style.trained : style.untrained
                        }`}
                    >
                        {card.example && <div className={style.sampleText}>{card.example}</div>}
                        <div className={style.infoContainer}>
                            <ModelInfo
                                config={card.config || {}}
                                tokeniser={card.tokeniser || 'char'}
                                trainingStats={hasTrainingStats ? card.trainingStats : undefined}
                                showDuration={hasTrainingStats}
                                showLayers={!hasTrainingStats && !card.trained}
                                showContextSize={!hasTrainingStats && !card.trained}
                                showTokens={!hasTrainingStats}
                            />
                        </div>
                        <div
                            className={style.sizeText}
                            style={{ fontSize: `${fontSize}rem`, width: `${fontSize * 2}rem` }}
                        >
                            {parameters >= 1 ? `${Math.round(parameters)}M` : `${parameters * 1000}K`}
                        </div>
                    </div>
                    <div className={style.buttonRow}>
                        <h2>{name}</h2>
                    </div>
                </>
            }
        />
    );
}
