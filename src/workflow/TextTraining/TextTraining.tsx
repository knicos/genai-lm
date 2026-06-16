import { Button } from '@genai-fi/base';
import { useEffect, useState } from 'react';
import style from './style.module.css';
import { tasks, tokensFromTasks, TrainingLogEntry } from '@genai-fi/nanogpt';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import useModelStatus from '../../hooks/useModelStatus';
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';
import PauseIcon from '@mui/icons-material/Pause';
import { useTranslation } from 'react-i18next';
import { wait } from '../../utilities/wait';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { trainerAtom, trainerSettings } from '../../state/trainer';
import NumberBox from '../../components/NumberBox/NumberBox';
import { trainingAnimation } from '../../state/animations';
import Clock from '../../components/Clock/Clock';
import useWakeLock from '../../hooks/wakeLock';
import { evaluatorAdvanced } from '../../state/evaluatorSettings';
import logger from '../../utilities/logger';
import { useNavigate } from 'react-router-dom';
import { LinearProgress, Switch, Tooltip } from '@mui/material';
import BoxNotice, { Notice } from '../../components/BoxTitle/BoxNotice';
import { loadedModelAtom, modelSaveCheckpoints } from '../../state/model';
import { dataEntries, datasetIdAtom, dataTokens } from '../../state/data';
import HelpBox from '../../components/Help/HelpBox';
import BoxStandalone from '../../components/BoxTitle/BoxStandalone';
import { set } from 'idb-keyval';
import { createDatasetFromEntries } from '../../utilities/dataset';

const CHECKPT_THRESHOLD = 3_000_000;

interface Props {
    autoTokenise?: boolean;
}

export default function TextTraining({ autoTokenise = false }: Props) {
    const { t } = useTranslation();
    const [trainer, setTrainer] = useAtom(trainerAtom);
    const [tokens, setTokens] = useState<number | undefined>(undefined);
    const [done, setDone] = useState(true);
    const [training, setTraining] = useState(false);
    const [needsTraining, setNeedsTraining] = useState(true);
    const model = useAtomValue(loadedModelAtom);
    const status = useModelStatus(model ?? undefined);
    const [dataset, setDataset] = useAtom(dataTokens);
    const entries = useAtomValue(dataEntries);
    const saveCheckpoints = useAtomValue(modelSaveCheckpoints);
    const [settings, setSettings] = useAtom(trainerSettings);
    const batchSize = settings.batchSize;
    const setTrainingAnimation = useSetAtom(trainingAnimation);
    const [trainingProgress, setTrainingProgress] = useState<TrainingLogEntry | null>(null);
    const advanced = useAtomValue(evaluatorAdvanced);
    const navigate = useNavigate();
    const [message, setMessage] = useState<Notice | null>(null);
    const [preparing, setPreparing] = useState<string | null>(null);
    const datasetId = useAtomValue(datasetIdAtom);

    useWakeLock(training);

    const canTrain = !!model && !!dataset && dataset.tokens.length > 0 && status !== 'loading' && status !== 'busy';

    const progress = trainingProgress && dataset ? trainingProgress.totalTokens / dataset.tokens.length : 0;
    const remaining =
        trainingProgress && progress > 0 ? trainingProgress.duration / progress - trainingProgress.duration : 0;
    const totalTokens = dataset ? dataset.tokens.length : 0;

    useEffect(() => {
        setTrainingAnimation(training);
    }, [training, setTrainingAnimation]);

    // Event to update training progress
    useEffect(() => {
        if (trainer) {
            const h = async (log: TrainingLogEntry) => {
                setTokens(log.totalTokens);
                setTrainingProgress(log);
                if (log.step % 100 === 0) {
                    logger.log({
                        action: 'training_step',
                        step: log.step,
                        loss: log.trainingMetrics.loss,
                        tokensPerSecond: log.tokensPerSecond,
                        validationLoss: log.validationMetrics?.loss,
                    });
                }
            };
            trainer.on('log', h);

            // Check for existing progress
            const lastLog = trainer.log[trainer.log.length - 1];
            if (lastLog) {
                setTokens(lastLog.totalTokens);
                setTrainingProgress(lastLog);
            } else {
                setTokens(0);
                setTrainingProgress(null);
            }

            return () => {
                trainer.off('log', h);
            };
        } else {
            setTokens(0);
            setTrainingProgress(null);
        }
    }, [trainer]);

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
    }, [model, setTrainer]);

    // Check if training and validation datasets need updating
    useEffect(() => {
        if (dataset && dataset.tokens.length > 0) {
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

        if (!dataset || dataset.tokens.length === 0) {
            if (autoTokenise) {
                setPreparing(t('training.tokenising'));
                const conversations = await createDatasetFromEntries(entries);
                const task = new tasks.ConversationTask(conversations);

                if (!model.tokeniser.trained) {
                    await model.tokeniser.train(conversations, undefined, datasetId);
                }

                const newTokens = await tokensFromTasks([task], model.tokeniser);
                setDataset({ tokens: newTokens, tokeniserId: model.tokeniser.id, datasetId });
                datasetTokens = newTokens;
            } else {
                setMessage({
                    notice: t('training.errors.noData'),
                    level: 'warning',
                });
                return;
            }
        }

        if (training && trainer) {
            trainer.stop();
            return;
        }

        if (model && datasetTokens && datasetTokens.length > 0) {
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

            setPreparing(t('training.preparingTrainer'));

            const modelSize = model.getNumParams();
            const useCheckpointing = modelSize > CHECKPT_THRESHOLD && !settings.disableCheckpointing;
            settings.gradientCheckpointing = useCheckpointing;
            const currentTrainer = model.trainer('pretraining', settings);

            if (training) {
                currentTrainer.stop();
                setTraining(false);
                return;
            }

            if (!done) {
                // already training
                return;
            }

            setTraining(true);
            setDone(false);

            const shouldPrepare = needsTraining || !currentTrainer.isPrepared();

            logger.log({ action: 'training_started', modelSize, totalTokens, batchSize });

            model.enableProfiler = advanced;
            //currentTrainer.options.metrics = advanced ? ['gradientNorm', 'accuracy'] : undefined;

            if (shouldPrepare) {
                try {
                    //const task = new tasks.PretrainingTask(dataset);
                    setPreparing(t('training.preparingData'));
                    await currentTrainer.prepare(datasetTokens, entries);
                    setPreparing(null);
                } catch (err) {
                    console.error('Error preparing training', err);
                    setMessage({
                        notice: t('training.errors.preparation'),
                        level: 'warning',
                    });
                    setTraining(false);
                    setDone(true);
                    return;
                }
            } else {
                setPreparing(null);
            }

            setNeedsTraining(false);

            setTrainer(currentTrainer);
            await wait(200);
            currentTrainer
                .train()
                .then(async () => {
                    setDone(true);
                    setTraining(false);
                    logger.log({ action: 'training_stopped' });

                    if (saveCheckpoints) {
                        try {
                            // Save checkpoint
                            const blob = await model.saveModel({
                                name: model.meta.name ?? 'model_checkpoint',
                                includeOptimizer: true,
                            });
                            const file = new File([blob], `model_checkpoint.zip`, { type: 'application/zip' });
                            await set('model_checkpoint', file);
                        } catch (err) {
                            console.error('Error saving checkpoint', err);
                        }
                    }
                })
                .catch((err) => {
                    setDone(true);
                    setTraining(false);
                    logger.error({ action: 'training_error', message: err.message });
                    currentTrainer.stop();
                    currentTrainer.reset();
                    setMessage({
                        notice: t('training.errors.trainingFailed'),
                        level: 'error',
                    });
                });
        }
    };

    return (
        <HelpBox
            message={t('training.help')}
            widget="trainer"
            active={!!model || (!!dataset && dataset.tokens.length > 0)}
        >
            <BoxStandalone
                style={{ width: '300px', minHeight: '360px' }}
                active={!!model || (!!dataset && dataset.tokens.length > 0)}
            >
                <div className={style.container}>
                    <BoxTitle
                        title={t('training.title')}
                        onSettings={() => navigate('training-settings')}
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
                            message={preparing ? t('training.preparing') : undefined}
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
                                disabled={!done && !training}
                                variant="contained"
                                startIcon={done ? <ModelTrainingIcon /> : <PauseIcon />}
                                onClick={() => startTraining()}
                            >
                                {done ? t('training.start') : t('training.stop')}
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
            </BoxStandalone>
        </HelpBox>
    );
}
