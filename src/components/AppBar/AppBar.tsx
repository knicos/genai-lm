import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import style from './AppBar.module.css';
import { IconButton, Tooltip } from '@mui/material';
import { Link } from 'react-router-dom';
import { useAtomValue, useSetAtom } from 'jotai';
import { uiShowSettings } from '../../state/uiState';
import SettingsIcon from '@mui/icons-material/Settings';
import { trainingAnimation } from '../../state/animations';
import { LANGS } from './langs';
import logger from '../../utilities/logger';
import WorkflowStatusBar from './WorkflowStatusBar';
import { LangSelect } from '@genai-fi/base';

interface Props {
    noSettings?: boolean;
    hideTitle?: boolean;
    hideWorkflow?: boolean;
    sidepanel?: string;
}

export default function ApplicationBar({ noSettings, hideTitle, hideWorkflow, sidepanel }: Props) {
    const { t } = useTranslation();
    const showSettings = useSetAtom(uiShowSettings);
    const istraining = useAtomValue(trainingAnimation);
    const [logId, setLogId] = useState<string | null>(null);

    useEffect(() => {
        const h = (_: string, idNumber: number) => {
            setLogId(String(idNumber));
        };
        logger.onId(h);
        return () => {
            logger.offId(h);
        };
    });

    return (
        <nav className={style.appbar}>
            <div className={style.toolbar}>
                <Link
                    to="/about"
                    className={style.logo}
                    title="About"
                    style={{ pointerEvents: 'none' }}
                >
                    <img
                        src="/logo128_bw.png"
                        alt="GenAI logo"
                        width="48"
                        height="48"
                    />
                    {!hideTitle && (
                        <h1>
                            <div className={style.little}>{t('app.little')}</div>
                            {t('app.languageMachine')}
                        </h1>
                    )}
                </Link>
                {logId && <div className={style.buttonBar}>{logId}</div>}
                {!hideWorkflow && (
                    <WorkflowStatusBar
                        disabled={istraining}
                        sidepanel={sidepanel}
                    />
                )}
                {hideWorkflow && <div style={{ flexGrow: 1 }}></div>}
                <LangSelect
                    languages={LANGS}
                    dark
                    ns="translation"
                />
                {!noSettings && (
                    <Tooltip
                        title={t('app.settings.title')}
                        arrow
                    >
                        <IconButton
                            color="inherit"
                            size="large"
                            onClick={() => showSettings(true)}
                            disabled={istraining}
                        >
                            <SettingsIcon fontSize="large" />
                        </IconButton>
                    </Tooltip>
                )}
            </div>
        </nav>
    );
}
