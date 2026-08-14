import { Tooltip } from '@mui/material';
import { qualityToColor } from '../../utilities/colours';
import prettyNumber from '../../utilities/prettyNumber';
import style from './style.module.css';
import StarIcon from '@mui/icons-material/Star';
import { useTranslation } from 'react-i18next';

const TARGET = 0.4;

interface Props {
    value: number;
    desired?: number;
    max?: number;
}

export default function DataProgress({ value, desired, max }: Props) {
    const { t } = useTranslation();
    const progress = Math.min(100, (value / (desired ? desired + TARGET * desired : max ? max : 100)) * 100);

    return (
        <div
            className={style.container}
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={120}
            aria-label="Data Progress"
            data-testid="progress-bar"
        >
            <div className={style.baseBar} />
            <div
                className={style.progress}
                style={{
                    width: `${progress}%`,
                    backgroundColor: qualityToColor(progress / 100),
                }}
                data-testid="progress-blob"
            />

            {desired !== undefined && (
                <Tooltip
                    arrow
                    title={t('tokeniseData.progressHelp')}
                >
                    <div
                        className={style.targetContainer}
                        style={{ left: `calc(60% + 10px)` }}
                    >
                        <div
                            className={style.target}
                            data-testid="target-icon"
                        >
                            <StarIcon fontSize="small" />
                        </div>
                        <div className={style.targetLabel}>{prettyNumber(desired, t)}</div>
                    </div>
                </Tooltip>
            )}
        </div>
    );
}
