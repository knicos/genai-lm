import { useTranslation } from 'react-i18next';
import style from './style.module.css';
import Circle from './Circle';
import Remaining from './Remaining';

interface Props {
    duration: number;
    totalDuration: number;
    remaining: number;
}

export default function Clock({ duration, totalDuration, remaining }: Props) {
    const { t } = useTranslation();
    const progress = totalDuration > 0 ? Math.min(duration / totalDuration, 1) : 0;

    const radius = 100;

    const totalSeconds = Math.floor(duration / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds - hours * 3600) / 60);
    const seconds = totalSeconds % 60;
    return (
        <Circle
            radius={radius}
            progress={progress}
            color="rgba(76, 175, 80, 0.6)"
        >
            <div className={style.timeRow}>
                {hours > 0 ? (
                    <div>
                        <div className={style.time}>{`${hours}:`}</div>
                        <div className={style.timeLabel}>{t('training.hours')}</div>
                    </div>
                ) : null}
                <div>
                    <div className={style.time}>{`${minutes < 10 ? '0' : ''}${minutes}`}</div>
                    <div className={style.timeLabel}>{t('training.minutes')}</div>
                </div>
                {hours === 0 ? (
                    <div>
                        <div className={style.time}>{`:${seconds < 10 ? '0' : ''}${seconds}`}</div>
                        <div className={style.timeLabel}>{t('training.seconds')}</div>
                    </div>
                ) : null}
            </div>
            <div className={style.remainingTime}>
                <Remaining remaining={remaining} />
            </div>
        </Circle>
    );
}
