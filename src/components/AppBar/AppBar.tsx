import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import style from './AppBar.module.css';
import { IconButton, NativeSelect, Tooltip } from '@mui/material';
import { Link } from 'react-router-dom';
import { useAtomValue, useSetAtom } from 'jotai';
import { uiShowSettings } from '../../state/uiState';
import SettingsIcon from '@mui/icons-material/Settings';
import { trainingAnimation } from '../../state/animations';
import { LANGS } from './langs';
import logger from '../../utilities/logger';
import WorkflowBar from '../WorkflowBar/WorkflowBar';

interface Props {
    noSettings?: boolean;
    hideTitle?: boolean;
    hideWorkflow?: boolean;
}

export default function ApplicationBar({ noSettings, hideTitle, hideWorkflow }: Props) {
    const { t, i18n } = useTranslation();
    const showSettings = useSetAtom(uiShowSettings);
    const istraining = useAtomValue(trainingAnimation);
    const [logId, setLogId] = useState<string | null>(null);

    const doChangeLanguage = useCallback(
        (e: React.ChangeEvent<HTMLSelectElement>) => {
            i18n.changeLanguage(e.target.value || 'en-GB');
        },
        [i18n]
    );

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
                >
                    <img
                        src="/logo48_bw_invert.png"
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
                    <WorkflowBar
                        items={[
                            { id: 'model' },
                            { id: 'pretraindata' },
                            { id: 'pretrain' },
                            { id: 'finetunedata' },
                            { id: 'finetune' },
                            { id: 'deployment' },
                        ]}
                    />
                )}
                {hideWorkflow && <div style={{ flexGrow: 1 }}></div>}
                <div className={style.langBar}>
                    <NativeSelect
                        value={i18n.language}
                        onChange={doChangeLanguage}
                        variant="outlined"
                        data-testid="select-lang"
                        disabled={istraining}
                        inputProps={{ 'aria-label': t('app.language') }}
                    >
                        {LANGS.map((lng) => (
                            <option
                                key={lng.name}
                                value={lng.name}
                            >
                                {lng.label}
                            </option>
                        ))}
                    </NativeSelect>
                </div>
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
