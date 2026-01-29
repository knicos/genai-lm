import { VerticalButton } from '@genai-fi/base';
import BoxMenu from '../../components/BoxTitle/BoxMenu';
import TuneIcon from '@mui/icons-material/Tune';
import { useTranslation } from 'react-i18next';
import ProgressBox from '../TextData/ProgressBox';
import AbcIcon from '@mui/icons-material/Abc';

interface Props {
    onShowSettings: () => void;
    onVocab: () => void;
    training?: boolean;
    tokens: number;
}

export default function TokeniserMenu({ onShowSettings, onVocab, training, tokens }: Props) {
    const { t } = useTranslation();

    return (
        <BoxMenu>
            <VerticalButton
                startIcon={<AbcIcon />}
                onClick={onVocab}
            >
                {t('tokeniser.vocabulary')}
            </VerticalButton>
            <VerticalButton
                disabled={!!training}
                startIcon={<TuneIcon />}
                onClick={onShowSettings}
            >
                {t('tokeniser.settings')}
            </VerticalButton>
            <ProgressBox totalSamples={tokens} />
        </BoxMenu>
    );
}
