import style from './style.module.css';
import { IconButton, TextField } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { useTranslation } from 'react-i18next';
import { Button } from '@genai-fi/base';
import PlusOneIcon from '@mui/icons-material/PlusOne';
import SendIcon from '@mui/icons-material/Send';
import StopIcon from '@mui/icons-material/Stop';
import { ChangeEvent, KeyboardEvent, useState } from 'react';

interface Props {
    disable?: boolean;
    generate?: boolean;
    enableSettings?: boolean;
    autoMode?: boolean;
    prompt?: boolean;
    onShowSettings: () => void;
    onGenerate: (prompt?: string) => void;
    onStop: () => void;
    onReset: () => void;
    onAutoModeChange?: (value: boolean) => void;
}

export default function Controls({ disable, generate, autoMode, prompt, onGenerate, onStop }: Props) {
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
                    variant="outlined"
                    multiline
                    fullWidth
                    value={promptText}
                    maxRows={5}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        setPromptText(e.target.value);
                    }}
                    onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            onGenerate(promptText);
                            setPromptText('');
                        }
                    }}
                />
            )}
            {prompt && (
                <div className={style.iconButtons}>
                    <IconButton
                        onClick={generate ? onStop : () => onGenerate(promptText)}
                        color="primary"
                    >
                        {generate ? <StopIcon /> : <SendIcon />}
                    </IconButton>
                </div>
            )}
        </div>
    );
}
