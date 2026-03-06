import { useTranslation } from 'react-i18next';
import NumberBox from '../../components/NumberBox/NumberBox';

interface Props {
    totalSamples: number;
    label?: string;
}

export default function ProgressBox({ totalSamples, label }: Props) {
    const { t } = useTranslation();

    return (
        <NumberBox
            value={totalSamples}
            label={label || t('data.samples')}
            style={{ marginLeft: 'auto' }}
        />
    );
}
