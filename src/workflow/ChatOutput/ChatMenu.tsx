import { VerticalButton } from '@genai-fi/base';
import BoxMenu from '../../components/BoxTitle/BoxMenu';
import TuneIcon from '@mui/icons-material/Tune';
import { useTranslation } from 'react-i18next';
import EditSquareIcon from '@mui/icons-material/EditSquare';

interface Props {
    onShowSettings: () => void;
    onReset: () => void;
    disabled?: boolean;
}

export default function ChatMenu({ onShowSettings, onReset, disabled }: Props) {
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
