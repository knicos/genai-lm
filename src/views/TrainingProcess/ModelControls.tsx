import { useEffect, useState } from 'react';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import { VerticalButton } from '@genai-fi/base';
import { useTranslation } from 'react-i18next';
import style from './controls.module.css';
import { FormControl, Slider } from '@mui/material';

export type AnimationStepName = 'none' | 'next' | 'wait' | 'predict' | 'updating' | 'done';

export interface AnimationStep {
    name: AnimationStepName;
    layer: number;
    index: number;
    locked?: boolean;
}

type IncrementFunction = (fn: (p: AnimationStep | null) => AnimationStep | null) => void;

interface Props {
    steps: AnimationStep[];
    disabled?: boolean;
    onStepChange: IncrementFunction;
}

export default function ModelControls({ steps, onStepChange, disabled }: Props) {
    const { t } = useTranslation();
    const [play, setPlay] = useState(false);
    const [speed, setSpeed] = useState(1);

    const delay = Math.floor(1000 / speed);

    useEffect(() => {
        if (play) {
            const interval = setInterval(() => {
                onStepChange((step) =>
                    step === null ? (steps[0] ?? null) : step.locked ? step : steps[(step.index + 1) % steps.length]
                );
            }, delay);

            return () => clearInterval(interval);
        }
    }, [play, onStepChange, steps, delay]);

    return (
        <div className={style.container}>
            <VerticalButton
                color="primary"
                onClick={() => setPlay(!play)}
                startIcon={play ? <PauseIcon /> : <PlayArrowIcon />}
                disabled={disabled}
            >
                {play ? t('tools.pause') : t('tools.play')}
            </VerticalButton>
            <VerticalButton
                color="primary"
                onClick={() =>
                    onStepChange((step) =>
                        step === null ? (steps[0] ?? null) : step.locked ? step : steps[(step.index + 1) % steps.length]
                    )
                }
                disabled={play || disabled}
                startIcon={<SkipNextIcon />}
            >
                {t('tools.step')}
            </VerticalButton>
            <FormControl style={{ marginLeft: '2rem' }}>
                <div
                    id="speed-label"
                    className={style.label}
                >
                    {t('app.settings.speed')}
                </div>
                <Slider
                    sx={{ minWidth: '150px' }}
                    aria-labelledby="speed-label"
                    value={speed}
                    onChange={(_, value) => setSpeed(value as number)}
                    min={0.5}
                    max={4}
                    step={0.5}
                    valueLabelDisplay="auto"
                />
            </FormControl>
        </div>
    );
}
