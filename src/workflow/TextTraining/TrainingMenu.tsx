import { VerticalButton } from '@genai-fi/base';
import BoxMenu from '../../components/BoxTitle/BoxMenu';
import TuneIcon from '@mui/icons-material/Tune';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { useTranslation } from 'react-i18next';
import { Tooltip } from '@mui/material';

interface Props {
    onShowSettings: () => void;
    onMonitor: () => void;
    onVisualize: () => void;
    training?: boolean;
}

export default function TrainingMenu({ onShowSettings, onMonitor, onVisualize, training }: Props) {
    const { t } = useTranslation();

    return (
        <BoxMenu>
            <Tooltip
                arrow
                title={t('training.monitorHelp')}
            >
                <VerticalButton
                    startIcon={<ShowChartIcon />}
                    onClick={onMonitor}
                >
                    {t('training.monitor')}
                </VerticalButton>
            </Tooltip>
            <Tooltip
                arrow
                title={t('training.visualizeHelp')}
            >
                <VerticalButton
                    startIcon={<AccountTreeIcon />}
                    onClick={onVisualize}
                >
                    {t('training.visualize')}
                </VerticalButton>
            </Tooltip>
            <VerticalButton
                disabled={!!training}
                startIcon={<TuneIcon />}
                onClick={onShowSettings}
            >
                {t('training.settings')}
            </VerticalButton>
        </BoxMenu>
    );
}
