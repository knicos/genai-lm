import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import style from './AppBar.module.css';
import { NativeSelect } from '@mui/material';
import { Link } from 'react-router-dom';
import { TeachableLLM, waitForModel } from '@genai-fi/nanogpt';
import { BusyButton } from '@genai-fi/base';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import FileOpenIcon from '@mui/icons-material/FileOpen';
import { saveAs } from 'file-saver';
import * as tf from '@tensorflow/tfjs';
import SaveDialog from './SaveDialog';

export const LANGS = [{ name: 'en-GB', label: 'English' }];

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
            const model = TeachableLLM.loadModel(tf, file);
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
                    <h1>Teachable Generator</h1>
                </Link>
                <div className={style.buttonBar}>
                    <BusyButton
                        busy={isloading}
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
                        disabled={!model}
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
