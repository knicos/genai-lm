import { Button, Help } from '@genai-fi/base';
import { useEffect, useState } from 'react';
import style from './style.module.css';
import { ITrainingJob, TrainingLogEntry } from '@genai-fi/nanogpt';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import useModelStatus from '../../hooks/useModelStatus';
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';
import PauseIcon from '@mui/icons-material/Pause';
import { useTranslation } from 'react-i18next';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { pftSettings, trainerJobIdAtom, trainerSettings, trainingModeAtom } from '../../state/trainer';
import NumberBox from '../../components/NumberBox/NumberBox';
import { trainingAnimation } from '../../state/animations';
import Clock from '../../components/Clock/Clock';
import useWakeLock from '../../hooks/wakeLock';
import logger from '../../utilities/logger';
import { useNavigate } from 'react-router';
import { LinearProgress, Switch, Tooltip } from '@mui/material';
import BoxNotice, { Notice } from '../../components/BoxTitle/BoxNotice';
import { loadedModelAtom, modelSaveCheckpoints } from '../../state/model';
import { dataEntries, datasetIdAtom, dataTokens, validationTokens } from '../../state/data';
import { autoTokeniseData, configureModelForTraining, saveCheckpoint } from './utilities';
import Box from '../../components/BoxTitle/Box';

interface Props {
    autoTokenise?: boolean;
}

export default function TextTraining({ autoTokenise = false }: Props) {
    const { t } = useTranslation();
    const [trainerJobId, setTrainerJobId] = useAtom(trainerJobIdAtom);
    const [tokens, setTokens] = useState<number | undefined>(undefined);
    const [done, setDone] = useState(true);
    const [training, setTraining] = useState(false);
    const [needsTraining, setNeedsTraining] = useState(true);
    const model = useAtomValue(loadedModelAtom);
    const status = useModelStatus(model ?? undefined);
    const [dataset, setDataset] = useAtom(dataTokens);
    const [validation, setValidationTokens] = useAtom(validationTokens);
    const entries = useAtomValue(dataEntries);
    const saveCheckpoints = useAtomValue(modelSaveCheckpoints);
    const [settings, setSettings] = useAtom(trainerSettings);
    const batchSize = settings.batchSize;
    const setTrainingAnimation = useSetAtom(trainingAnimation);
    const [trainingProgress, setTrainingProgress] = useState<TrainingLogEntry | null>(null);
    const navigate = useNavigate();
    const [message, setMessage] = useState<Notice | null>(null);
    const [preparing, setPreparing] = useState<string | null>(null);
    const [stopping, setStopping] = useState(false);
    const datasetId = useAtomValue(datasetIdAtom);
    const trainingMode = useAtomValue(trainingModeAtom);
    const partialSettings = useAtomValue(pftSettings);

    useWakeLock(training);

    const canTrain =
        !!model && !!dataset && dataset.tokens.getTokenCount() > 0 && status !== 'loading' && status !== 'busy';

    const totalTokens = dataset ? dataset.tokens.getTokenCount() : 0;
    const progress = trainingProgress && dataset ? trainingProgress.totalTokens / totalTokens : 0;
    const remaining =
        trainingProgress && progress > 0 ? trainingProgress.duration / progress - trainingProgress.duration : 0;

    useEffect(() => {
        setTrainingAnimation(training);
    }, [training, setTrainingAnimation]);

    // Event to update training progress
    useEffect(() => {
        if (model && trainerJobId) {
            const h = (job: ITrainingJob) => {
                if (job.id !== trainerJobId) return;
                if (job.history) {
                    const log = job.history[job.history.length - 1];
                    setTrainingProgress(log);
                    if (log) {
                        setTokens(log.totalTokens);
                    }
                    if (log.step % 100 === 0) {
                        logger.log({
                            action: 'training_step',
                            step: log.step,
                            loss: log.trainingMetrics.loss,
                            tokensPerSecond: log.tokensPerSecond,
                            validationLoss: log.validationMetrics?.loss,
                        });
                    }
                }
            };
            model.training.on('progress', h);

            // Check for existing progress
            const job = model.training.getJob(trainerJobId);
            const lastLog = job?.history?.[job.history.length - 1];
            if (lastLog) {
                setTokens(lastLog.totalTokens);
                setTrainingProgress(lastLog);
            } else {
                setTokens(0);
                setTrainingProgress(null);
            }

            return () => {
                model.training.off('progress', h);
            };
        } else {
            setTokens(0);
            setTrainingProgress(null);
        }
    }, [model, trainerJobId]);

    // Reset if model changes
    useEffect(() => {
        if (model) {
            setMessage(null);
            const h = () => {
                setNeedsTraining(!model.meta.trained);
                model.off('loaded', h);
            };
            model.on('loaded', h);
            return () => {
                model.off('loaded', h);
            };
        }
    }, [model]);

    // Check if training and validation datasets need updating
    useEffect(() => {
        if (dataset && dataset.tokens.getShardCount() > 0) {
            setNeedsTraining(true);
            setMessage(null);
        }
    }, [dataset]);

    const startTraining = async () => {
        if (!model) {
            setMessage({
                notice: t('training.errors.noModel'),
                level: 'warning',
            });
            return;
        }

        let datasetTokens = dataset?.tokens;
        let validationTokens = validation?.tokens;
        let previousJobId = trainerJobId;

        if (previousJobId) {
            const job = model.training.getJob(previousJobId);
            if (job) {
                if (job.state === 'running' || job.state === 'paused' || job.state === 'pausing') {
                    setStopping(true);
                    model.training.cancel(previousJobId);
                    return;
                } else if (job.state !== 'completed' && job.state !== 'cancelled') {
                    setMessage({
                        notice: t('training.errors.jobNotCompleted'),
                        level: 'error',
                    });
                    return;
                }

                if (job.datasetId && datasetId && job.datasetId !== datasetId) {
                    console.log('Reset training job because dataset has changed', job.datasetId, datasetId);
                    previousJobId = null;
                }

                const lastStep = job.history?.[job.history.length - 1]?.step || 0;
                if (previousJobId && (settings.maxEpochs || 1) * (settings.epochSteps || 1) <= lastStep) {
                    if ((settings.maxEpochs || 1) * (settings.epochSteps || 1) <= lastStep) {
                        setMessage({
                            notice: t('training.errors.noRemainingTokens'),
                            level: 'warning',
                        });
                        return;
                    }
                }
            } else {
                console.warn('Previous training job not found, starting new training');
                previousJobId = null;
            }
        }

        if (!datasetTokens || datasetTokens.getShardCount() === 0 || datasetTokens.tokeniserId !== model.tokeniser.id) {
            if (autoTokenise) {
                setPreparing(t('training.tokenising'));
                try {
                    const newTokens = await autoTokeniseData(entries, model, datasetId);
                    setDataset(newTokens.trainingTokens);
                    console.log('Auto-tokenised training dataset', newTokens.trainingTokens);
                    datasetTokens = newTokens.trainingTokens.tokens;

                    if (newTokens.validationTokens) {
                        setValidationTokens(newTokens.validationTokens);
                        validationTokens = newTokens.validationTokens.tokens;
                    }
                } catch (error) {
                    console.error('Error tokenising data', error);
                    setMessage({
                        notice: t('training.errors.tokenisationFailed'),
                        level: 'error',
                    });
                    return;
                }
            } else {
                console.log('No dataset tokens available, cannot start training', datasetTokens, model.tokeniser.id);
                setMessage({
                    notice: t('training.errors.noData'),
                    level: 'warning',
                });
                return;
            }
        }

        if (model && datasetTokens && datasetTokens.getShardCount() > 0) {
            if (!model.loaded) {
                setMessage({
                    notice: t('training.errors.notReady'),
                    level: 'warning',
                });
                return;
            }
            if (!model.tokeniser.trained) {
                setMessage({
                    notice: t('training.errors.tokeniserNotTrained'),
                    level: 'warning',
                });
                return;
            }

            setPreparing(t('training.preparing'));

            const realSettings = trainingMode === 'partial' ? partialSettings : settings;
            if (previousJobId) {
                realSettings.previous_job_id = previousJobId;
            } else {
                realSettings.previous_job_id = undefined;
            }

            // Logging rate from total tokens to avoid logging too frequently or slowly.
            const totalTokens = datasetTokens.getTokenCount();
            const MAX_LOG_STEPS = 40;
            const MIN_LOG_STEPS = 10;
            const scaling = Math.min(1, Math.floor(totalTokens / 1_000_000));
            const logSteps = MIN_LOG_STEPS + Math.floor((MAX_LOG_STEPS - MIN_LOG_STEPS) * scaling);
            realSettings.logInterval = logSteps;

            configureModelForTraining(model, realSettings);

            try {
                const job = await model.training.job(realSettings, datasetTokens, entries, validationTokens);

                if (!job) {
                    setPreparing(null);
                    setMessage({
                        notice: t('training.errors.noJob'),
                        level: 'warning',
                    });
                    return;
                }

                const errorHandler = (id: string, err: Error) => {
                    if (id === job.id) {
                        setDone(true);
                        setTraining(false);
                        logger.error({ action: 'training_error', message: err.message });
                        model.training.off('error', errorHandler);
                        setMessage({
                            notice: t(`training.errors.${err.message}`, {
                                defaultValue: t('training.errors.trainingFailed'),
                            }),
                            level: 'error',
                        });
                    }
                };
                model.training.on('error', errorHandler);

                const doneHandler = async (jobId: string) => {
                    if (jobId === job.id) {
                        if (job.history) {
                            const log = job.history[job.history.length - 1];
                            setTrainingProgress(log);
                            if (log) {
                                setTokens(log.totalTokens);
                            }
                        }
                        setDone(true);
                        setTraining(false);
                        setStopping(false);
                        logger.log({ action: 'training_stopped' });

                        if (saveCheckpoints) {
                            await saveCheckpoint(model);
                        }
                        model.training.off('completed', doneHandler);
                        model.training.off('cancelled', doneHandler);
                        model.training.off('error', errorHandler);
                    }
                };
                model.training.on('completed', doneHandler);
                model.training.on('cancelled', doneHandler);

                setPreparing(null);

                setTraining(true);
                setDone(false);
                setNeedsTraining(false);

                logger.log({ action: 'training_started', modelSize: model.getNumParams(), totalTokens, batchSize });

                setTrainerJobId(job.id);
            } catch (err) {
                console.error('Error preparing training', err);
                setMessage({
                    notice: t('training.errors.preparation'),
                    level: 'warning',
                });
                setTraining(false);
                setDone(true);
                setPreparing(null);
            }
        }
    };

    return (
        <Help
            message={t('training.help')}
            widget="trainer"
            active={!!model && !!dataset && dataset.tokens.getShardCount() > 0}
            keepOpen
            placement="right"
        >
            <Box
                style={{ width: '300px', minHeight: '360px' }}
                active={!!model && !!dataset && dataset.tokens.getShardCount() > 0}
                widget="trainer"
                useParent
            >
                <div className={style.container}>
                    <BoxTitle
                        title={t('training.title')}
                        onSettings={() => navigate('training-settings')}
                        disableSettings={training}
                        status={
                            !done
                                ? 'busy'
                                : needsTraining && canTrain
                                  ? 'waiting'
                                  : !needsTraining
                                    ? 'done'
                                    : 'disabled'
                        }
                    />
                    <div className={style.clockContainer}>
                        <Clock
                            duration={trainingProgress?.duration || 0}
                            totalDuration={trainingProgress ? trainingProgress.duration + remaining : 0}
                            remaining={Math.max(0, remaining)}
                            message={preparing ? preparing : undefined}
                        />
                        <div className={style.stats}>
                            <NumberBox
                                value={tokens ?? 0}
                                label={t('training.tokens')}
                                flip
                            />
                            <NumberBox
                                value={Math.max(0, totalTokens - (tokens || 0))}
                                label={t('training.remaining')}
                            />
                        </div>
                    </div>
                    <div className={style.buttonBox}>
                        {preparing && <LinearProgress sx={{ width: '100%' }} />}
                        {!preparing && (
                            <Button
                                disabled={(!done && !training) || stopping}
                                variant="contained"
                                startIcon={done ? <ModelTrainingIcon /> : <PauseIcon />}
                                onClick={() => startTraining()}
                            >
                                {done ? t('training.start') : stopping ? t('training.stopping') : t('training.stop')}
                            </Button>
                        )}
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
        </Help>
    );
}
