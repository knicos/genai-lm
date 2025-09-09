import { useTranslation } from 'react-i18next';
import NumberBox from '../../components/NumberBox/NumberBox';

interface Props {
    totalSamples: number;
}

export default function ProgressBox({ totalSamples }: Props) {
    const { t } = useTranslation();

    return (
        <NumberBox
            value={totalSamples}
            label={t('data.samples')}
        />
    );
}
