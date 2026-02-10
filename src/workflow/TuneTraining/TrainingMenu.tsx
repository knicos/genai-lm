import { VerticalButton } from '@genai-fi/base';
import BoxMenu from '../../components/BoxTitle/BoxMenu';
import TuneIcon from '@mui/icons-material/Tune';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { useTranslation } from 'react-i18next';

interface Props {
    onShowSettings: () => void;
    onMonitor: () => void;
    training?: boolean;
}

export default function TrainingMenu({ onShowSettings, onMonitor, training }: Props) {
    const { t } = useTranslation();

    return (
        <BoxMenu>
            <VerticalButton
                startIcon={<ShowChartIcon />}
                onClick={onMonitor}
            >
                {t('training.monitor')}
            </VerticalButton>
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
