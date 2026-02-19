import { Button } from '@genai-fi/base';
import { useEffect, useState } from 'react';
import style from './style.module.css';
import { TrainingLogEntry } from '@genai-fi/nanogpt';
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
import { modelAtom } from '../../state/model';
import { dataTokens } from '../../state/data';

const CHECKPT_THRESHOLD = 3_000_000;

interface TrainingProgress {
    duration: number;
    totalSamples: number;
    samplesPerSecond: number;
    remaining: number;
    progress: number;
}

export default function TextTraining() {
    const { t } = useTranslation();
    const [trainer, setTrainer] = useAtom(trainerAtom);
    const [epochs, setEpochs] = useState<number | undefined>(undefined);
    const [done, setDone] = useState(true);
    const [training, setTraining] = useState(false);
    const [needsTraining, setNeedsTraining] = useState(true);
    const model = useAtomValue(modelAtom);
    const status = useModelStatus(model ?? undefined);
    const dataset = useAtomValue(dataTokens);
    const [settings, setSettings] = useAtom(trainerSettings);
    const batchSize = settings.batchSize;
    const setTrainingAnimation = useSetAtom(trainingAnimation);
    const [trainingProgress, setTrainingProgress] = useState<TrainingProgress | null>(null);
    const advanced = useAtomValue(evaluatorAdvanced);
    const navigate = useNavigate();
    const [message, setMessage] = useState<Notice | null>(null);
    const [totalSamples, setTotalSamples] = useState(0);
    const [preparing, setPreparing] = useState(false);

    useWakeLock(training);

    const canTrain = !!model && !!dataset && dataset.length > 0 && status !== 'loading' && status !== 'busy';

    useEffect(() => {
        setTrainingAnimation(training);
    }, [training, setTrainingAnimation]);

    // Event to update training progress
    useEffect(() => {
        if (trainer) {
            const h = async (log: TrainingLogEntry, progress: TrainingProgress) => {
                setEpochs(log.step);
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
    }, [trainer]);

    // Reset if model changes
    useEffect(() => {
        if (model) {
            setMessage(null);
            setTrainer(null);
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
        if (dataset && dataset.length > 0) {
            setNeedsTraining(true);
            setMessage(null);
        }
    }, [dataset]);

    useEffect(() => {
        setTrainer(null);
    }, [settings, setTrainer]);

    const startTraining = async () => {
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
        if (model && dataset) {
            if (!model.loaded) {
                setMessage({
                    notice: t('training.errors.notReady'),
                    level: 'warning',
                });
                return;
            }
            if (!model.tokeniser.trained) {
                throw new Error('Model tokeniser is not trained.');
            }

            const modelSize = model.getNumParams();
            const useCheckpointing = modelSize > CHECKPT_THRESHOLD && !settings.disableCheckpointing;
            settings.gradientCheckpointing = useCheckpointing;
            const currentTrainer = trainer ?? model.trainer('pretraining', settings);

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

            // setEpochs(0);
            await wait(200);

            logger.log({ action: 'training_started', modelSize, totalSamples, batchSize });

            model.enableProfiler = advanced;
            currentTrainer.options.advancedMetrics = advanced;

            if (shouldPrepare) {
                try {
                    //const task = new tasks.PretrainingTask(dataset);
                    setPreparing(true);
                    await currentTrainer.prepare(dataset);
                    setPreparing(false);
                    setTotalSamples(currentTrainer.getTotalSamples());
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
            }

            setNeedsTraining(false);

            currentTrainer
                .train()
                .then(() => {
                    setDone(true);
                    setTraining(false);
                    logger.log({ action: 'training_stopped' });
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

            setTrainer(currentTrainer);
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
                        remaining={Math.max(0, trainingProgress?.remaining || 0)}
                        message={preparing ? t('training.preparing') : undefined}
                    />
                    <div className={style.stats}>
                        <NumberBox
                            value={(epochs || 0) * batchSize}
                            label={t('training.samples')}
                            flip
                        />
                        <NumberBox
                            value={Math.max(0, totalSamples - (epochs || 0) * batchSize)}
                            label={t('training.remaining')}
                        />
                    </div>
                </div>
                <div className={style.buttonBox}>
                    <Button
                        disabled={!done && !training}
                        variant="contained"
                        startIcon={done ? <ModelTrainingIcon /> : <PauseIcon />}
                        onClick={() => startTraining()}
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
