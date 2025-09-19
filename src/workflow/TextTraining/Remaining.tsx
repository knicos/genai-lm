import { useTranslation } from 'react-i18next';
import NumberBox from '../../components/NumberBox/NumberBox';

interface Props {
    remaining: number;
}

export default function Remaining({ remaining }: Props) {
    const { t } = useTranslation();

    const totalSeconds = remaining / 1000;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return (
            <NumberBox
                value={hours}
                unit={t('training.hours')}
                label={t('training.remaining')}
            />
        );
    }
    if (minutes > 0) {
        return (
            <NumberBox
                value={minutes}
                unit={t('training.minutes')}
                label={t('training.remaining')}
            />
        );
    }

    return (
        <NumberBox
            value={seconds}
            unit={t('training.seconds')}
            label={t('training.remaining')}
        />
    );
}
