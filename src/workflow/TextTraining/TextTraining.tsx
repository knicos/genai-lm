import { Button } from '@genai-fi/base';
import { useEffect, useMemo, useState } from 'react';
import style from './style.module.css';
import { TeachableLLM, TrainingLogEntry } from '@genai-fi/nanogpt';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import useModelStatus from '../../utilities/useModelStatus';
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';
import PauseIcon from '@mui/icons-material/Pause';
import { useTranslation } from 'react-i18next';
import { wait } from '../../utilities/wait';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { trainerAtom, trainerSettings } from '../../state/trainer';
import NumberBox from '../../components/NumberBox/NumberBox';
import Box from '../../components/BoxTitle/Box';
import { trainingAnimation } from '../../state/animations';
import Clock from '../../components/Clock/Clock';
import useWakeLock from '../../utilities/wakeLock';
import { evaluatorAdvanced } from '../../state/evaluatorSettings';
import logger from '../../utilities/logger';
import { useNavigate } from 'react-router-dom';
import TrainingMenu from './TrainingMenu';
import { Switch, Tooltip } from '@mui/material';
import BoxNotice, { Notice } from '../../components/BoxTitle/BoxNotice';

const CHECKPT_THRESHOLD = 5_000_000;

interface Props {
    model?: TeachableLLM;
    dataset?: string[];
}

interface TrainingProgress {
    duration: number;
    totalSamples: number;
    samplesPerSecond: number;
    remaining: number;
    progress: number;
}

export default function TextTraining({ model, dataset }: Props) {
    const { t } = useTranslation();
    const [trainer, setTrainer] = useAtom(trainerAtom);
    const [epochs, setEpochs] = useState<number | undefined>(undefined);
    const [done, setDone] = useState(true);
    const [training, setTraining] = useState(false);
    const [needsTraining, setNeedsTraining] = useState(true);
    const status = useModelStatus(model);
    const [settings, setSettings] = useAtom(trainerSettings);
    const batchSize = settings.batchSize;
    const maxSteps = settings.maxSteps;
    const disableCheckpointing = settings.disableCheckpointing;
    const learningRate = settings.learningRate;
    const setTrainingAnimation = useSetAtom(trainingAnimation);
    const [lr, setLR] = useState(0.0);
    const [trainingProgress, setTrainingProgress] = useState<TrainingProgress | null>(null);
    const advanced = useAtomValue(evaluatorAdvanced);
    const navigate = useNavigate();
    const [message, setMessage] = useState<Notice | null>(null);

    useWakeLock(training);

    const canTrain = !!model && !!dataset && dataset.length > 0 && status !== 'loading' && status !== 'busy';

    const totalSamples = useMemo(() => (dataset ? dataset.reduce((acc, curr) => acc + curr.length, 0) : 0), [dataset]);

    useEffect(() => {
        setTrainingAnimation(training);
    }, [training, setTrainingAnimation]);

    useEffect(() => {
        if (trainer) {
            const h = async (log: TrainingLogEntry, progress: TrainingProgress) => {
                setEpochs(log.step);
                //model?.getProfiler()?.printSummary();
                setTrainingProgress(progress);
                if (log.step % 100 === 0) {
                    logger.log({
                        action: 'training_step',
                        step: log.step,
                        loss: log.loss,
                        samplesPerSecond: progress.samplesPerSecond,
                        validationLoss: log.valLoss,
                    });
                }
            };
            trainer.on('log', h);
            return () => {
                trainer.off('log', h);
            };
        }
    }, [trainer, totalSamples, batchSize, model]);

    useEffect(() => {
        if (model) {
            setMessage(null);
            const h = () => {
                setTrainer(model.trainer());
                setNeedsTraining(!model.meta.trained);
                model.off('loaded', h);
            };
            model.on('loaded', h);
            return () => {
                model.off('loaded', h);
            };
        }
    }, [model, setTrainer]);

    useEffect(() => {
        if (dataset && dataset.length > 0) {
            setNeedsTraining(true);
            setMessage(null);
        }
    }, [dataset]);

    useEffect(() => {
        if (model) {
            setLR(model.meta.trained ? learningRate * 0.1 : learningRate);
        }
    }, [learningRate, model]);

    const startTraining = async (maxSteps: number) => {
        if (!model) {
            setMessage({
                notice: t('training.errors.noModel'),
                level: 'warning',
            });
            return;
        }
        if (!dataset || dataset.length === 0) {
            setMessage({
                notice: t('training.errors.noData'),
                level: 'warning',
            });
            return;
        }
        if (model && dataset && trainer) {
            if (!model.loaded) {
                setMessage({
                    notice: t('training.errors.notReady'),
                    level: 'warning',
                });
                return;
            }
            if (!model.tokeniser.trained) {
                await model.trainTokeniser(dataset);
                await wait(10);
            }

            if (training) {
                trainer.stop();
                setTraining(false);
                return;
            }

            if (!done) {
                // already training
                return;
            }

            setTraining(true);
            setDone(false);

            const shouldPrepare = needsTraining || !trainer.isPrepared();

            // setEpochs(0);
            await wait(200);

            const modelSize = model.getNumParams();
            const useCheckpointing = modelSize > CHECKPT_THRESHOLD && !disableCheckpointing;

            logger.log({ action: 'training_started', modelSize, totalSamples, batchSize, useCheckpointing });

            model.enableProfiler = advanced;
            const trainingOptions = {
                batchSize,
                maxSteps,
                learningRate: lr > 0 ? lr : learningRate,
                advancedMetrics: advanced,
                gradientCheckpointing: useCheckpointing,
            };
            if (shouldPrepare) {
                try {
                    await trainer.prepare(dataset, trainingOptions);
                } catch {
                    setMessage({
                        notice: t('training.errors.preparation'),
                        level: 'warning',
                    });
                    setTraining(false);
                    setDone(true);
                    return;
                }
            }

            setNeedsTraining(false);

            trainer
                .train(trainingOptions)
                .then(() => {
                    setDone(true);
                    setTraining(false);
                    logger.log({ action: 'training_stopped' });
                })
                .catch((err) => {
                    setDone(true);
                    setTraining(false);
                    logger.error({ action: 'training_error', message: err.message });
                });
        }
    };

    return (
        <Box
            widget="trainer"
            active={!!model || (!!dataset && dataset.length > 0)}
            style={{ minWidth: '260px' }}
        >
            <div className={style.container}>
                <BoxTitle
                    title={t('training.title')}
                    status={
                        !done ? 'busy' : needsTraining && canTrain ? 'waiting' : !needsTraining ? 'done' : 'disabled'
                    }
                />
                <TrainingMenu
                    training={training}
                    onShowSettings={() => navigate('training-settings')}
                    onMonitor={() => navigate('training-log')}
                    onVisualize={() => navigate('training-process')}
                />
                <div className={style.clockContainer}>
                    <Clock
                        duration={trainingProgress?.duration || 0}
                        totalDuration={trainingProgress ? trainingProgress.duration + trainingProgress.remaining : 0}
                        remaining={trainingProgress?.remaining || 0}
                    />
                    <div className={style.stats}>
                        <NumberBox
                            value={(epochs || 0) * batchSize}
                            label={t('training.samples')}
                            flip
                        />
                        <NumberBox
                            value={totalSamples - (epochs || 0) * batchSize}
                            label={t('training.remaining')}
                        />
                    </div>
                </div>
                <div className={style.buttonBox}>
                    <Button
                        disabled={!done && !training}
                        variant="contained"
                        startIcon={done ? <ModelTrainingIcon /> : <PauseIcon />}
                        onClick={() => startTraining(maxSteps)}
                    >
                        {done ? t('training.start') : t('training.stop')}
                    </Button>
                    <Tooltip
                        title={t('training.autoOutput')}
                        arrow
                    >
                        <Switch
                            disabled={training}
                            checked={settings.outputText}
                            onChange={(e) => setSettings({ ...settings, outputText: e.target.checked })}
                            data-testid="auto-output-switch"
                            aria-label={t('training.autoOutput')}
                            color="success"
                        />
                    </Tooltip>
                </div>
                {message && (
                    <BoxNotice
                        notice={message}
                        onClose={() => setMessage(null)}
                    />
                )}
            </div>
        </Box>
    );
}
