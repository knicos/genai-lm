import { VerticalButton } from '@genai-fi/base';
import BoxMenu from '../../components/BoxTitle/BoxMenu';
import TuneIcon from '@mui/icons-material/Tune';
import { useTranslation } from 'react-i18next';
import EditSquareIcon from '@mui/icons-material/EditSquare';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined';
import { Tooltip } from '@mui/material';

interface Props {
    onShowSettings: () => void;
    onReset: () => void;
    onConfidence?: () => void;
    onScore?: () => void;
    disabled?: boolean;
    highlightMode?: 'none' | 'confidence' | 'score';
}

export default function ChatMenu({ onShowSettings, onReset, onConfidence, onScore, disabled, highlightMode }: Props) {
    const { t } = useTranslation();

    return (
        <BoxMenu>
            <VerticalButton
                startIcon={<EditSquareIcon />}
                onClick={onReset}
                disabled={disabled}
            >
                {t('generator.reset')}
            </VerticalButton>
            {onConfidence && (
                <Tooltip
                    title={<div style={{ maxWidth: 200, textAlign: 'center' }}>{t('generator.confidenceTooltip')}</div>}
                    arrow
                >
                    <VerticalButton
                        startIcon={<SignalCellularAltIcon />}
                        onClick={onConfidence}
                        disabled={disabled}
                        color={highlightMode === 'confidence' ? 'secondary' : 'primary'}
                    >
                        {t('generator.confidence')}
                    </VerticalButton>
                </Tooltip>
            )}
            {onScore && (
                <Tooltip
                    title={<div style={{ maxWidth: 200, textAlign: 'center' }}>{t('generator.scoreTooltip')}</div>}
                    arrow
                >
                    <VerticalButton
                        startIcon={<WorkspacePremiumOutlinedIcon />}
                        onClick={onScore}
                        disabled={disabled}
                        color={highlightMode === 'score' ? 'secondary' : 'primary'}
                    >
                        {t('generator.score')}
                    </VerticalButton>
                </Tooltip>
            )}
            <div style={{ flex: 1 }} />
            <VerticalButton
                disabled={disabled}
                startIcon={<TuneIcon />}
                onClick={onShowSettings}
            >
                {t('generator.settings')}
            </VerticalButton>
        </BoxMenu>
    );
}
