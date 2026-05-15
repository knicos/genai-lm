import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import style from './controls.module.css';
import { FormControl, Slider } from '@mui/material';
import { IGenerator } from '@genai-fi/nanogpt';
import ModeSwitch from '../../components/ModeSwitch/ModeSwitch';
import { useAtomValue } from 'jotai';
import { trainerAtom } from '../../state/trainer';

export type AnimationStepName = 'none' | 'next' | 'tokenise' | 'predict' | 'updating' | 'done';

export interface AnimationStep {
    name: AnimationStepName;
    layer: number;
    index: number;
    locked?: boolean;
    multiplier?: number;
}

type IncrementFunction = (fn: (p: AnimationStep | null) => AnimationStep | null) => void;

interface Props {
    steps: AnimationStep[];
    disabled?: boolean;
    onStepChange: IncrementFunction;
    generator: IGenerator | null;
    visMode: 'training' | 'inference';
    setVisMode: (mode: 'training' | 'inference') => void;
}

export default function ModelControls({ steps, onStepChange, generator, visMode, setVisMode }: Props) {
    const { t } = useTranslation();
    const [speed, setSpeed] = useState(1);
    const playRef = useRef<{ resolve?: () => void; interval?: number } | null>(null);
    const trainer = useAtomValue(trainerAtom);
    const speedRef = useRef(speed);

    speedRef.current = speed;

    const doStart = useCallback(() => {
        if (playRef.current) {
            if (playRef.current.interval) {
                clearTimeout(playRef.current.interval);
            }
            if (playRef.current.resolve) {
                playRef.current.resolve();
            }
        }
        let decaySteps = 0;
        let decayStep = -1;

        const stepFn = () => {
            if (playRef.current) {
                playRef.current.interval = undefined;
            }
            onStepChange((step) => {
                if (decayStep === -1 && step?.multiplier) {
                    decayStep = step.index;
                    decaySteps = step.multiplier;
                }
                if (decaySteps > 0) {
                    --decaySteps;
                    if (decaySteps <= 0) {
                        decaySteps = 0;
                        decayStep = -1;
                    }
                }
                if (decayStep >= 0) {
                    if (playRef.current) {
                        if (playRef.current.interval) {
                            clearTimeout(playRef.current.interval);
                        }
                        playRef.current.interval = window.setTimeout(stepFn, Math.floor(200 / speedRef.current));
                    }
                    return step;
                }

                if (step?.index === steps.length - 1 && !step.locked && playRef.current?.resolve) {
                    playRef.current.resolve();
                    playRef.current = null;
                    return steps[(step.index + 1) % steps.length];
                }

                if (playRef.current) {
                    if (playRef.current.interval) {
                        clearTimeout(playRef.current.interval);
                    }
                    playRef.current.interval = window.setTimeout(stepFn, Math.floor(200 / speedRef.current));
                }

                return step === null ? (steps[0] ?? null) : step.locked ? step : steps[(step.index + 1) % steps.length];
            });
        };

        playRef.current = {
            interval: window.setTimeout(stepFn, Math.floor(200 / speedRef.current)),
        };
    }, [onStepChange, steps]);

    const doStop = useCallback(() => {
        if (playRef.current) {
            if (playRef.current.interval) {
                clearTimeout(playRef.current.interval);
            }
            if (playRef.current.resolve) {
                playRef.current.resolve();
            }
            playRef.current = null;
        }
    }, []);

    // Hook into the trainer
    useEffect(() => {
        if (trainer) {
            const hStep = () => {
                return new Promise<void>((resolve) => {
                    doStart();
                    if (playRef.current) {
                        playRef.current.resolve = resolve;
                    }
                });
            };
            trainer.on('log', hStep);

            return () => {
                trainer.off('log', hStep);
                doStop();
            };
        }
    }, [trainer, doStop, doStart]);

    useEffect(() => {
        if (generator) {
            const hStart = doStart;
            const hStop = doStop;
            generator.on('start', hStart);
            generator.on('stop', hStop);

            return () => {
                generator.off('start', hStart);
                generator.off('stop', hStop);
            };
        }
    }, [generator, doStart, doStop]);

    return (
        <div className={style.container}>
            <FormControl>
                <ModeSwitch
                    mode={visMode === 'inference'}
                    setMode={(mode: boolean) => setVisMode(mode ? 'inference' : 'training')}
                    startLabel={t('app.settings.trainingVis')}
                    endLabel={t('app.settings.inferenceVis')}
                />
            </FormControl>
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
