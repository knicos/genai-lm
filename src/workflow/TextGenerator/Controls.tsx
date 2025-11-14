import style from './style.module.css';
import { IconButton, Switch, Tooltip } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import TuneIcon from '@mui/icons-material/Tune';
import { useTranslation } from 'react-i18next';
import { Button } from '@genai-fi/base';
import PlusOneIcon from '@mui/icons-material/PlusOne';

interface Props {
    disable?: boolean;
    generate?: boolean;
    enableSettings?: boolean;
    autoMode?: boolean;
    onShowSettings: () => void;
    onGenerate: () => void;
    onCopy: () => void;
    onReset: () => void;
    onAutoModeChange?: (value: boolean) => void;
}

export default function Controls({
    disable,
    generate,
    enableSettings,
    autoMode,
    onShowSettings,
    onGenerate,
    onCopy,
    onReset,
    onAutoModeChange,
}: Props) {
    const { t } = useTranslation();

    return (
        <div className={style.titleRow}>
            <Button
                size="large"
                variant="contained"
                disabled={disable}
                startIcon={generate ? <PauseIcon /> : autoMode ? <PlayArrowIcon /> : <PlusOneIcon />}
                onClick={onGenerate}
            >
                {generate ? t('generator.pause') : autoMode ? t('generator.generate') : t('generator.step')}
            </Button>
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
                <Tooltip
                    title={t('generator.reset')}
                    arrow
                >
                    <IconButton
                        color="inherit"
                        disabled={disable}
                        onClick={onReset}
                    >
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip
                    title={t('generator.copy')}
                    arrow
                >
                    <IconButton
                        color="inherit"
                        disabled={disable}
                        onClick={onCopy}
                    >
                        <ContentCopyIcon />
                    </IconButton>
                </Tooltip>
                {enableSettings && (
                    <Tooltip
                        title={t('generator.settingsTooltip')}
                        arrow
                    >
                        <IconButton
                            color="inherit"
                            disabled={disable}
                            onClick={onShowSettings}
                        >
                            <TuneIcon />
                        </IconButton>
                    </Tooltip>
                )}
            </div>
        </div>
    );
}
