import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, IconButton } from '@mui/material';
import style from './style.module.css';
import CloseIcon from '@mui/icons-material/Close';
import CardView from '../../components/CardView/CardView';
import ToolCard from '../../components/ToolCard/ToolCard';
import { ToolCardItem } from '../../components/ToolCard/type';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { uiDeveloperMode } from '../../state/uiState';

const TOOLS: { title: string; cards: ToolCardItem[]; developer?: boolean }[] = [
    {
        title: 'tools.Visualizations',
        cards: [
            {
                id: 'training-process',
                name: 'tools.trainingProcess',
                url: 'training-process',
                icon: 'insights',
            },
            {
                id: 'training-log',
                name: 'tools.training.title',
                url: 'training-log',
                icon: 'insights',
            },
        ],
    },
    {
        title: 'tools.Settings',
        cards: [
            {
                id: 'generator-settings',
                name: 'tools.generatorSettings',
                url: 'generator-settings',
                icon: 'settings',
            },
            {
                id: 'training-settings',
                name: 'tools.trainingSettings',
                url: 'training-settings',
                icon: 'settings',
            },
        ],
    },
    {
        title: 'tools.advanced',
        developer: true,
        cards: [
            {
                id: 'checks',
                name: 'tools.checks',
                url: 'checks',
                icon: 'developer',
            },
            {
                id: 'debug-model',
                name: 'tools.debugModel',
                url: 'debug-model',
                icon: 'developer',
            },
            {
                id: 'gradients',
                name: 'tools.gradients',
                url: 'gradients',
                icon: 'developer',
            },
        ],
    },
];

interface Props {
    onClose: () => void;
}

export default function Tools({ onClose }: Props) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [open, setOpen] = useState(true);
    const developerMode = useAtomValue(uiDeveloperMode);

    useEffect(() => {
        if (!open) {
            const timer = setTimeout(() => {
                onClose();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [open, onClose]);

    const pathEnd = location.pathname.split('/')[3] ?? null;

    const handleSelect = useCallback(
        (card: ToolCardItem) => {
            console.log('Selected model:', card);
            if (card.url) {
                navigate(card.url);
                setOpen(false);
            }
        },
        [navigate]
    );

    const langTools = TOOLS.filter((group) => !group.developer || developerMode).map((group) => ({
        ...group,
        title: t(group.title),
    }));

    return (
        <Dialog
            open={open}
            onClose={() => setOpen(false)}
            maxWidth="lg"
            fullWidth
            sx={{ '& .MuiPaper-root': { margin: '0', borderRadius: '0' } }}
        >
            <DialogContent sx={{ padding: '0' }}>
                <div className={style.headerBar}>
                    <div style={{ flexGrow: 1 }} />
                    <IconButton
                        onClick={() => setOpen(false)}
                        aria-label={t('data.close')}
                    >
                        <CloseIcon fontSize="large" />
                    </IconButton>
                </div>
                <CardView
                    data={langTools}
                    onSelect={handleSelect}
                    CardComponent={ToolCard}
                    selectedSet={pathEnd ? new Set([pathEnd]) : undefined}
                />
            </DialogContent>
        </Dialog>
    );
}
