import { Tooltip } from '@mui/material';
import { qualityToColor } from '../../utilities/colours';
import prettyNumber from '../../utilities/prettyNumber';
import style from './style.module.css';
import StarIcon from '@mui/icons-material/Star';
import { useTranslation } from 'react-i18next';

const TARGET = 0.4;

interface Props {
    samplesProcessed: number;
    desiredSamples: number;
}

export default function DataProgress({ samplesProcessed, desiredSamples }: Props) {
    const { t } = useTranslation();
    const progress = Math.min(100, (samplesProcessed / (desiredSamples + TARGET * desiredSamples)) * 100);

    return (
        <div
            className={style.container}
            role="progressbar"
            aria-valuenow={samplesProcessed}
            aria-valuemin={0}
            aria-valuemax={120}
            aria-label="Data Progress"
            data-testid="progress-bar"
        >
            <div className={style.baseBar} />
            <div
                className={style.progress}
                style={{
                    width: `${desiredSamples > 0 ? progress : 0}%`,
                    backgroundColor: qualityToColor(progress / 100),
                }}
                data-testid="progress-blob"
            />

            <Tooltip
                arrow
                title={t('tokeniseData.progressHelp')}
            >
                <div
                    className={style.targetContainer}
                    style={{ left: `calc(60% - 10px)` }}
                >
                    <div
                        className={style.target}
                        data-testid="target-icon"
                    >
                        <StarIcon fontSize="small" />
                    </div>
                    <div className={style.targetLabel}>{prettyNumber(desiredSamples, t)}</div>
                </div>
            </Tooltip>
        </div>
    );
}
