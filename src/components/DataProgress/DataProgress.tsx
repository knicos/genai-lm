import { qualityToColor } from '../../utilities/colours';
import prettyNumber from '../../utilities/prettyNumber';
import style from './style.module.css';
import StarIcon from '@mui/icons-material/Star';

const TARGET = 0.4;

interface Props {
    samplesProcessed: number;
    desiredSamples: number;
}

export default function DataProgress({ samplesProcessed, desiredSamples }: Props) {
    const progress = Math.min(100, (samplesProcessed / (desiredSamples + TARGET * desiredSamples)) * 100);

    return (
        <div
            className={style.container}
            role="progressbar"
            aria-valuenow={samplesProcessed}
            aria-valuemin={0}
            aria-valuemax={120}
            aria-label="Data Progress"
        >
            <div className={style.baseBar} />
            <div
                className={style.progress}
                style={{ width: `${progress}%`, backgroundColor: qualityToColor(progress / 100) }}
            />

            <div
                className={style.target}
                style={{ left: `calc(60% - 10px)` }}
            >
                <StarIcon fontSize="small" />
            </div>
            <div
                className={style.targetLabel}
                style={{ left: `calc(60% - 10px)` }}
            >
                {prettyNumber(desiredSamples)}
            </div>
        </div>
    );
}
