import { useEffect, useState } from 'react';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import { VerticalButton } from '@genai-fi/base';
import ReadMoreIcon from '@mui/icons-material/ReadMore';
import { useTranslation } from 'react-i18next';
import style from './controls.module.css';

type IncrementFunction = (p: number) => number;

interface Props {
    step: number;
    totalSteps: number;
    onIncrement: (f: IncrementFunction) => void;
    delay?: number;
    onNext: () => void;
}

export default function ModelControls({ step, totalSteps, onIncrement, onNext, delay }: Props) {
    const { t } = useTranslation();
    const [play, setPlay] = useState(true);

    useEffect(() => {
        if (play) {
            const interval = setInterval(() => {
                onIncrement((p) => Math.min(p + 1, totalSteps));
            }, delay ?? 500);

            return () => clearInterval(interval);
        }
    }, [play, onIncrement, totalSteps, delay]);

    return (
        <div className={style.container}>
            <VerticalButton
                color="primary"
                onClick={onNext}
                startIcon={<ReadMoreIcon />}
            >
                {t('tools.nextSample')}
            </VerticalButton>
            <VerticalButton
                color="primary"
                onClick={() => setPlay(!play)}
                startIcon={play ? <PauseIcon /> : <PlayArrowIcon />}
            >
                {play ? t('tools.pause') : t('tools.play')}
            </VerticalButton>
            <VerticalButton
                color="primary"
                onClick={() => onIncrement((p) => Math.min(p + 1, totalSteps))}
                disabled={play || step >= totalSteps}
                startIcon={<SkipNextIcon />}
            >
                {t('tools.step')}
            </VerticalButton>
        </div>
    );
}
