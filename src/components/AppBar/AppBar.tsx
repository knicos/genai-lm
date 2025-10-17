import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import style from './AppBar.module.css';
import { IconButton, NativeSelect, Tooltip } from '@mui/material';
import { Link } from 'react-router-dom';
import { TeachableLLM, waitForModel } from '@genai-fi/nanogpt';
import { BusyButton } from '@genai-fi/base';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import FileOpenIcon from '@mui/icons-material/FileOpen';
import { saveAs } from 'file-saver';
import SaveDialog from './SaveDialog';
import { useAtomValue, useSetAtom } from 'jotai';
import { uiShowSettings } from '../../state/uiState';
import SettingsIcon from '@mui/icons-material/Settings';
import { trainingAnimation } from '../../state/animations';
import { LANGS } from './langs';

interface Props {
    model?: TeachableLLM;
    onModel: (model: TeachableLLM) => void;
}

export default function ApplicationBar({ model, onModel }: Props) {
    const { t, i18n } = useTranslation();
    const [saving, setSaving] = useState(false);
    const [isloading, setIsLoading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const showSettings = useSetAtom(uiShowSettings);
    const istraining = useAtomValue(trainingAnimation);

    const doChangeLanguage = useCallback(
        (e: React.ChangeEvent<HTMLSelectElement>) => {
            i18n.changeLanguage(e.target.value || 'en-GB');
        },
        [i18n]
    );

    const doSave = useCallback(
        (name: string) => {
            setSaving(true);
            model
                ?.saveModel({ includeLog: false, name })
                .then((blob) => {
                    setSaving(false);
                    saveAs(blob, `${name}.zip`);
                })
                .catch((e) => {
                    console.error('Error saving model:', e);
                });
        },
        [model]
    );

    const openFile = useCallback(
        (file: File) => {
            setIsLoading(true);
            const model = TeachableLLM.loadModel(file);
            model.meta.trained = true;
            onModel(model);
            waitForModel(model).then(() => {
                setIsLoading(false);
            });
        },
        [onModel]
    );

    return (
        <nav className={style.appbar}>
            <input
                type="file"
                accept=".zip"
                ref={fileRef}
                style={{ display: 'none' }}
                onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                        const file = e.target.files[0];
                        openFile(file);
                    }
                }}
            />
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
                    <h1>
                        <div className={style.little}>{t('app.little')}</div>
                        {t('app.languageMachine')}
                    </h1>
                </Link>
                <div className={style.buttonBar}>
                    <BusyButton
                        busy={isloading}
                        disabled={istraining}
                        data-testid="open-project"
                        color="inherit"
                        variant="outlined"
                        startIcon={<FileOpenIcon />}
                        onClick={() => fileRef.current?.click()}
                    >
                        {t('app.load')}
                    </BusyButton>
                    <BusyButton
                        busy={!!saving}
                        disabled={!model || istraining}
                        data-testid="save-project"
                        color="inherit"
                        variant="outlined"
                        startIcon={<SaveAltIcon />}
                        onClick={() => setShowSaveDialog(true)}
                    >
                        {t('app.save')}
                    </BusyButton>
                </div>
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
            </div>
            <SaveDialog
                open={showSaveDialog}
                onClose={() => setShowSaveDialog(false)}
                onSave={(props) => {
                    doSave(props.name);
                    setShowSaveDialog(false);
                }}
            />
        </nav>
    );
}
