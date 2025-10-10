import ScheduleIcon from '@mui/icons-material/Schedule';
import { useTranslation } from 'react-i18next';
import splitTime from '../../utilities/splitTime';

interface Props {
    duration: number;
}

export default function TrainingDuration({ duration }: Props) {
    const { t } = useTranslation();

    const { hours, minutes, seconds } = splitTime(duration);

    return (
        <p>
            <ScheduleIcon />{' '}
            {t('model.duration', {
                duration:
                    hours > 0
                        ? t('model.durationHours', { count: hours })
                        : minutes > 0
                        ? t('model.durationMinutes', { count: minutes })
                        : t('model.durationSeconds', { count: seconds }),
            })}
        </p>
    );
}
