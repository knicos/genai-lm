import style from './style.module.css';
import { Switch, TextField, Tooltip } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { useTranslation } from 'react-i18next';
import { Button } from '@genai-fi/base';
import PlusOneIcon from '@mui/icons-material/PlusOne';
import { ChangeEvent, KeyboardEvent, useState } from 'react';

interface Props {
    disable?: boolean;
    generate?: boolean;
    enableSettings?: boolean;
    autoMode?: boolean;
    prompt?: boolean;
    onShowSettings: () => void;
    onGenerate: (prompt?: string) => void;
    onReset: () => void;
    onAutoModeChange?: (value: boolean) => void;
}

export default function Controls({ disable, generate, autoMode, prompt, onGenerate, onAutoModeChange }: Props) {
    const { t } = useTranslation();
    const [promptText, setPromptText] = useState<string>('');

    return (
        <div className={style.titleRow}>
            {!prompt && (
                <Button
                    size="large"
                    variant="contained"
                    disabled={disable}
                    startIcon={generate ? <PauseIcon /> : autoMode ? <PlayArrowIcon /> : <PlusOneIcon />}
                    onClick={() => onGenerate()}
                >
                    {generate ? t('generator.pause') : autoMode ? t('generator.generate') : t('generator.step')}
                </Button>
            )}
            {prompt && (
                <TextField
                    variant="standard"
                    value={promptText}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        setPromptText(e.target.value);
                    }}
                    onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === 'Enter') {
                            onGenerate(promptText);
                            setPromptText('');
                        }
                    }}
                />
            )}
            <div className={style.iconButtons}>
                <Tooltip
                    title={t('generator.autoGenerate')}
                    arrow
                >
                    <Switch
                        disabled={disable}
                        checked={autoMode}
                        onChange={(e) => onAutoModeChange && onAutoModeChange(e.target.checked)}
                        data-testid="auto-generate-switch"
                        aria-label={t('generator.autoGenerateAriaLabel')}
                        color="success"
                    />
                </Tooltip>
            </div>
        </div>
    );
}
