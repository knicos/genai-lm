import { MouseEvent } from 'react';
import style from './style.module.css';
import { ToolCardItem } from './type';
import Card from '../Card/Card';
import { IconButton } from '@mui/material';
import ViewSidebarIcon from '@mui/icons-material/ViewSidebar';
import { useTranslation } from 'react-i18next';
import SettingsIcon from '@mui/icons-material/Settings';
import InsightsIcon from '@mui/icons-material/Insights';
import DeveloperModeIcon from '@mui/icons-material/DeveloperMode';

function makeIcon(icon: string) {
    switch (icon) {
        case 'settings':
            return <SettingsIcon fontSize="inherit" />;
        case 'insights':
            return <InsightsIcon fontSize="inherit" />;
        case 'developer':
            return <DeveloperModeIcon fontSize="inherit" />;
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
                    <div className={`${style.sampleBox} ${style.untrained}`}>
                        {makeIcon(card.icon)}
                        <div className={style.sizeIcon}>
                            <IconButton
                                color="secondary"
                                onClick={(e: MouseEvent) => {
                                    e.stopPropagation();
                                    onSelect(card);
                                }}
                            >
                                <ViewSidebarIcon fontSize="medium" />
                            </IconButton>
                        </div>
                    </div>
                    <div className={style.buttonRow}>
                        <h2>{t(card.name)}</h2>
                    </div>
                </>
            }
            content={
                <>
                    <div className={`${style.sampleBox} ${used ? style.disabledBG : style.untrained}`}>
                        {makeIcon(card.icon)}
                    </div>
                    <div className={style.buttonRow}>
                        <h2>{t(name)}</h2>
                    </div>
                </>
            }
        />
    );
}
