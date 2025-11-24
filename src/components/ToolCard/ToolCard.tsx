import { MouseEvent } from 'react';
import style from './style.module.css';
import { ToolCardItem } from './type';
import Card from '../Card/Card';
import { IconButton } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { useTranslation } from 'react-i18next';
import SettingsIcon from '@mui/icons-material/Settings';

function makeIcon(icon: string) {
    switch (icon) {
        case 'settings':
            return <SettingsIcon fontSize="inherit" />;
        default:
            return null;
    }
}

interface Props {
    onSelect: (card: ToolCardItem) => void;
    onHighlight: (id: string, close?: boolean) => void;
    highlighted?: boolean;
    disabled?: boolean;
    used?: boolean;
    card: ToolCardItem;
}

export default function ToolCard({ onSelect, onHighlight, used, card, highlighted, disabled }: Props) {
    const { t } = useTranslation();

    const { name } = card;

    return (
        <Card
            onSelect={onSelect}
            card={card}
            onHighlight={onHighlight}
            highlighted={highlighted}
            disabled={disabled}
            used={used}
            onClick={() => onSelect(card)}
            expandedContent={
                <>
                    <div className={`${style.expandedSampleBox} ${style.untrained}`}>{makeIcon(card.icon)}</div>
                    <div className={style.buttonRow}>
                        <h2>{t(card.name)}</h2>
                        <div style={{ flexGrow: 1 }} />
                        <IconButton
                            color="secondary"
                            onClick={(e: MouseEvent) => {
                                e.stopPropagation();
                                onSelect(card);
                            }}
                        >
                            <DownloadIcon fontSize="large" />
                        </IconButton>
                    </div>
                </>
            }
            content={
                <>
                    <div className={`${style.sampleBox} ${used ? style.disabledBG : style.untrained}`}>
                        {makeIcon(card.icon)}
                    </div>
                    <h2>{t(name)}</h2>
                </>
            }
        />
    );
}
