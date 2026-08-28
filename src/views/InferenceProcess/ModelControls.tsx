import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import style from './controls.module.css';
import { FormControl, IconButton, Slider } from '@mui/material';
import { TeachableLLM } from '@genai-fi/nanogpt';
import { useAtomValue } from 'jotai';
import { trainerJobIdAtom } from '../../state/trainer';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import SkipNextIcon from '@mui/icons-material/SkipNext';

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
    model: TeachableLLM | null;
    responseId: string | null;
}

export default function ModelControls({ steps, onStepChange, model, responseId }: Props) {
    const { t } = useTranslation();
    const [speed, setSpeed] = useState(1);
    const [paused, setPaused] = useState(false);
    const playRef = useRef<{
        resolve?: () => void;
        interval?: number;
        paused: boolean;
        takeStep: boolean;
        step: number;
    } | null>(null);
    const trainerJobId = useAtomValue(trainerJobIdAtom);
    const speedRef = useRef(speed);

    speedRef.current = speed;
    if (playRef.current) {
        playRef.current.paused = paused;
    }

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
            onStepChange((step) => {
                const isPaused = playRef.current?.paused;

                if (playRef.current?.interval) {
                    clearTimeout(playRef.current.interval);
                    playRef.current.interval = undefined;
                }

                if (playRef.current) {
                    if (isPaused) {
                        if (!playRef.current.takeStep) {
                            playRef.current.interval = window.setTimeout(stepFn, Math.floor(200 / speedRef.current));
                            return step;
                        }
                        playRef.current.takeStep = false;
                    }
                }

                // If not pause then continue counting down to the next step change
                // If paused, it may be taking a step so skip any decay delay
                if (!isPaused) {
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

                    // Schedule next update but return now to prevent any step change.
                    if (decayStep >= 0) {
                        if (playRef.current) {
                            playRef.current.interval = window.setTimeout(stepFn, Math.floor(200 / speedRef.current));
                        }
                        return step;
                    }
                }

                // Finish entire sequence and reset. Allow training to continue
                if (step?.index === steps.length - 1 && !step.locked && playRef.current?.resolve) {
                    playRef.current.resolve();
                    playRef.current = null;
                    return steps[(step.index + 1) % steps.length];
                }

                // Otherwise, schedule the next step change.
                if (playRef.current) {
                    playRef.current.interval = window.setTimeout(stepFn, Math.floor(200 / speedRef.current));
                }

                // Return the appropriate next step based on the current state.
                return step === null ? (steps[0] ?? null) : step.locked ? step : steps[(step.index + 1) % steps.length];
            });
        };

        playRef.current = {
            interval: window.setTimeout(stepFn, Math.floor(200 / speedRef.current)),
            paused: false,
            takeStep: false,
            step: 0,
        };
    }, [onStepChange, steps]);

    const doStop = useCallback(
        (id: string | null) => {
            if (id !== responseId && id !== null) return;
            if (playRef.current) {
                if (playRef.current.interval) {
                    clearTimeout(playRef.current.interval);
                }
                if (playRef.current.resolve) {
                    playRef.current.resolve();
                }
                playRef.current = null;
            }
        },
        [responseId]
    );

    // Hook into the trainer
    useEffect(() => {
        if (model && trainerJobId) {
            const pauseHandler = (jobId: string) => {
                if (jobId !== trainerJobId) return;
                doStart();
                if (playRef.current) {
                    playRef.current.resolve = () => {
                        model.training.resume(trainerJobId);
                    };
                }
            };
            model.training.on('paused', pauseHandler);

            return () => {
                model.training.off('paused', pauseHandler);
                doStop(null);
            };
        }
    }, [model, trainerJobId, doStop, doStart]);

    useEffect(() => {
        if (model && responseId) {
            const hStop = doStop;

            doStart();
            model.responses.on('done', hStop);

            return () => {
                model.responses.off('done', hStop);
            };
        }
    }, [model, doStart, doStop, responseId]);

    return (
        <div className={style.container}>
            <IconButton
                onClick={() => setPaused(!paused)}
                size="medium"
                aria-label={paused ? t('tools.play') : t('tools.pause')}
            >
                {paused ? <PlayCircleIcon fontSize="large" /> : <PauseCircleIcon fontSize="large" />}
            </IconButton>
            <IconButton
                onClick={() => {
                    if (playRef.current) {
                        playRef.current.takeStep = true;
                    }
                }}
                size="medium"
                disabled={!paused}
                aria-label={t('tools.step')}
            >
                <SkipNextIcon fontSize="large" />
            </IconButton>
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
