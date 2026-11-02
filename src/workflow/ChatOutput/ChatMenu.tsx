import { VerticalButton } from '@genai-fi/base';
import { useChangePath } from '../../hooks/useChangePath';
import BoxMenu from '../../components/BoxTitle/BoxMenu';
import TuneIcon from '@mui/icons-material/Tune';
import { useTranslation } from 'react-i18next';
import type { HighlightMode } from '../../state/uiState';
import EditSquareIcon from '@mui/icons-material/EditSquare';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined';
import { Tooltip } from '@mui/material';
import { uiAuditOutput } from '../../state/uiState';
import { useAtomValue } from 'jotai';
import style from './style.module.css';
import PolicyIcon from '@mui/icons-material/Policy';
import ModelIcon from '../../icons/ModelIcon';

interface Props {
    onShowSettings: () => void;
    onReset: () => void;
    onConfidence?: () => void;
    onScore?: () => void;
    disabled?: boolean;
    highlightMode?: HighlightMode;
    showAudit?: boolean;
    onOpen?: () => void;
}

export default function ChatMenu({
    onShowSettings,
    onReset,
    onConfidence,
    onScore,
    disabled,
    highlightMode,
    showAudit,
    onOpen,
}: Props) {
    const { t } = useTranslation();
    const auditMode = useAtomValue(uiAuditOutput);
    const changeFlow = useChangePath();

    return (
        <BoxMenu>
            <VerticalButton
                startIcon={<EditSquareIcon />}
                onClick={onReset}
                disabled={disabled}
            >
                {t('generator.reset')}
            </VerticalButton>
            {onOpen && (
                <VerticalButton
                    startIcon={<ModelIcon noExtraIcon />}
                    onClick={onOpen}
                    disabled={disabled}
                >
                    {t('generator.open')}
                </VerticalButton>
            )}
            {showAudit && (
                <VerticalButton
                    startIcon={<PolicyIcon />}
                    color={auditMode ? 'secondary' : 'primary'}
                    onClick={() => {
                        changeFlow(auditMode ? { sidepanel: null } : { sidepanel: 'audit', flow: 'deployment' });
                    }}
                    disabled={disabled}
                >
                    {t('generator.audit')}
                </VerticalButton>
            )}
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
            {auditMode && (
                <Tooltip
                    title={<div style={{ maxWidth: 200, textAlign: 'center' }}>{t('generator.auditMode')}</div>}
                    arrow
                >
                    <div className={style.auditMode}>
                        <PolicyIcon />
                    </div>
                </Tooltip>
            )}
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
