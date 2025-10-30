import { useTranslation } from 'react-i18next';
import NumberBox from '../NumberBox/NumberBox';
import splitTime from '../../utilities/splitTime';

interface Props {
    remaining: number;
}

export default function Remaining({ remaining }: Props) {
    const { t } = useTranslation();

    const { hours, minutes, seconds } = splitTime(remaining);

    if (hours > 0) {
        return (
            <NumberBox
                value={hours}
                unit={t('training.hours')}
                label={t('training.remaining')}
                flip
            />
        );
    }
    if (minutes > 0) {
        return (
            <NumberBox
                value={minutes}
                unit={t('training.minutes')}
                label={t('training.remaining')}
                flip
            />
        );
    }

    return (
        <NumberBox
            value={seconds}
            unit={t('training.seconds')}
            label={t('training.remaining')}
            flip
        />
    );
}
