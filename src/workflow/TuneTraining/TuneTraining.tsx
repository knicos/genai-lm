import { Button } from '@genai-fi/base';
import { useEffect, useState } from 'react';
import style from './style.module.css';
import { tasks, TrainingLogEntry } from '@genai-fi/nanogpt';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import useModelStatus from '../../utilities/useModelStatus';
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';
import PauseIcon from '@mui/icons-material/Pause';
import { useTranslation } from 'react-i18next';
import { wait } from '../../utilities/wait';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { tunerSettings, tunerAtom } from '../../state/trainer';
import NumberBox from '../../components/NumberBox/NumberBox';
import Box from '../../components/BoxTitle/Box';
import { trainingAnimation } from '../../state/animations';
import useWakeLock from '../../utilities/wakeLock';
import { evaluatorAdvanced } from '../../state/evaluatorSettings';
import logger from '../../utilities/logger';
import { useNavigate } from 'react-router-dom';
import TrainingMenu from './TrainingMenu';
import BoxNotice, { Notice } from '../../components/BoxTitle/BoxNotice';
import { modelAtom } from '../../state/model';
import { conversationDataAtom } from '../../state/data';
import FineTuneBars from '../../components/FineTuneBars/FineTuneBars';

const CHECKPT_THRESHOLD = 3_000_000;

interface TrainingProgress {
    duration: number;
    totalSamples: number;
    samplesPerSecond: number;
    remaining: number;
    progress: number;
}

export default function TuneTraining() {
    const { t } = useTranslation();
    const [trainer, setTrainer] = useAtom(tunerAtom);
    const [epochs, setEpochs] = useState<number | undefined>(undefined);
    const [done, setDone] = useState(true);
    const [training, setTraining] = useState(false);
    const [needsTraining, setNeedsTraining] = useState(true);
    const model = useAtomValue(modelAtom);
    const status = useModelStatus(model ?? undefined);
    const conversations = useAtomValue(conversationDataAtom);
    const settings = useAtomValue(tunerSettings);
    const batchSize = settings.batchSize;
    const setTrainingAnimation = useSetAtom(trainingAnimation);
    //const [trainingProgress, setTrainingProgress] = useState<TrainingProgress | null>(null);
    const advanced = useAtomValue(evaluatorAdvanced);
    const navigate = useNavigate();
    const [message, setMessage] = useState<Notice | null>(null);
    const [totalSamples, setTotalSamples] = useState(0);
    //const [preparing, setPreparing] = useState(false);

    useWakeLock(training);

    const canTrain =
        !!model && !!conversations && conversations.length > 0 && status !== 'loading' && status !== 'busy';

    useEffect(() => {
        setTrainingAnimation(training);
    }, [training, setTrainingAnimation]);

    useEffect(() => {
        if (trainer) {
            const h = async (log: TrainingLogEntry, progress: TrainingProgress) => {
                setEpochs(log.step);
                //model?.getProfiler()?.printSummary();
                //setTrainingProgress(progress);
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
                const modelSize = model.getNumParams();
                const useCheckpointing = modelSize > CHECKPT_THRESHOLD && !settings.disableCheckpointing;
                const trainingOptions = {
                    ...settings,
                    gradientCheckpointing: useCheckpointing,
                };
                setTrainer(model.trainer('sft', trainingOptions));
                setNeedsTraining(!model.meta.trained);
                model.off('loaded', h);
            };
            model.on('loaded', h);
            return () => {
                model.off('loaded', h);
            };
        }
    }, [model, setTrainer, settings]);

    useEffect(() => {
        if (conversations && conversations.length > 0) {
            setNeedsTraining(true);
            setMessage(null);
        }
    }, [conversations]);

    const startTraining = async () => {
        if (!model) {
            setMessage({
                notice: t('training.errors.noModel'),
                level: 'warning',
            });
            return;
        }
        if (!conversations || conversations.length === 0) {
            setMessage({
                notice: t('training.errors.noData'),
                level: 'warning',
            });
            return;
        }
        if (model && conversations && trainer) {
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
            logger.log({ action: 'training_started', modelSize, totalSamples, batchSize });

            model.enableProfiler = advanced;
            trainer.options.advancedMetrics = advanced;

            if (shouldPrepare) {
                try {
                    const task = new tasks.ConversationTask(conversations);
                    //setPreparing(true);
                    await trainer.prepare([task]);
                    //setPreparing(false);
                    setTotalSamples(conversations.length);
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

            trainer
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
                    trainer.stop();
                    trainer.reset();
                    setMessage({
                        notice: t('training.errors.trainingFailed'),
                        level: 'error',
                    });
                });
        }
    };

    return (
        <Box
            widget="finetuner"
            active={!!model || (!!conversations && conversations.length > 0)}
            style={{ minWidth: '260px' }}
        >
            <div className={style.container}>
                <BoxTitle
                    title={t('finetune.title')}
                    status={
                        !done ? 'busy' : needsTraining && canTrain ? 'waiting' : !needsTraining ? 'done' : 'disabled'
                    }
                />
                <TrainingMenu
                    training={training}
                    onShowSettings={() => navigate('tuning-settings')}
                    onMonitor={() => navigate('training-log')}
                />
                <div className={style.clockContainer}>
                    {model && trainer && conversations && (
                        <FineTuneBars
                            model={model}
                            trainer={trainer}
                            conversations={conversations}
                        />
                    )}
                </div>
                <div className={style.buttonBox}>
                    <Button
                        disabled={!done && !training}
                        variant="contained"
                        startIcon={done ? <ModelTrainingIcon /> : <PauseIcon />}
                        onClick={() => startTraining()}
                    >
                        {done ? t('finetune.start') : t('finetune.stop')}
                    </Button>
                    <NumberBox
                        value={(epochs || 0) * batchSize}
                        label={t('training.samples')}
                    />
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
