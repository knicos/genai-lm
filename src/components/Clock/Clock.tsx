import { useTranslation } from 'react-i18next';
import style from './style.module.css';
import Circle from './Circle';
import Remaining from './Remaining';
import { useAtomValue } from 'jotai';
import { deviceCapabilities } from '../../state/device';
import NumberBox from '../NumberBox/NumberBox';
import { useState } from 'react';

interface Props {
    duration: number;
    totalDuration: number;
    remaining: number;
    message?: string;
    initialMode?: 'time' | 'energy';
}

export default function Clock({ duration, totalDuration, remaining, message, initialMode }: Props) {
    const { t } = useTranslation();
    const deviceCap = useAtomValue(deviceCapabilities);
    const [mode, setMode] = useState<'time' | 'energy'>(initialMode || 'energy');

    const progress = totalDuration > 0 ? Math.min(duration / totalDuration, 1) : 0;

    const radius = 100;

    const totalSeconds = Math.floor(duration / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds - hours * 3600) / 60);
    const seconds = totalSeconds % 60;
    const power = deviceCap?.powerUse ? deviceCap.powerUse : 0;
    const powerUsed = power * (duration / 3600000);
    const powerRemaining = power * (remaining / 3600000);

    return (
        <Circle
            radius={radius}
            progress={progress}
            color="rgba(76, 175, 80, 0.6)"
            onClick={() => setMode(mode === 'time' ? 'energy' : 'time')}
        >
            {!message && (
                <>
                    {mode === 'time' && (
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
                    )}
                    {mode === 'energy' && (
                        <div className={style.timeRow}>
                            <div>
                                <div className={style.time}>
                                    {powerUsed > 1e3 ? (powerUsed / 1000).toFixed(1) : powerUsed.toFixed(1)}
                                </div>
                                <div className={style.timeLabel}>
                                    {t(powerUsed > 1e3 ? 'training.kWh' : 'training.Wh')}
                                </div>
                            </div>
                        </div>
                    )}
                    <div className={style.remainingTime}>
                        {mode === 'time' && <Remaining remaining={remaining} />}
                        {mode === 'energy' && (
                            <NumberBox
                                value={powerRemaining > 1e3 ? powerRemaining / 1000 : powerRemaining}
                                unit={t(powerRemaining > 1e3 ? 'training.kWh' : 'training.Wh')}
                                label={t('training.remaining')}
                                flip
                                fixed={1}
                            />
                        )}
                    </div>
                </>
            )}
            {message ? <div className={style.message}>{message}</div> : null}
        </Circle>
    );
}
