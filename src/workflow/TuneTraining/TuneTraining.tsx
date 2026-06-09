import { Button } from '@genai-fi/base';
import { useEffect, useState } from 'react';
import style from './style.module.css';
import { tasks, TrainingLogEntry } from '@genai-fi/nanogpt';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import useModelStatus from '../../hooks/useModelStatus';
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';
import PauseIcon from '@mui/icons-material/Pause';
import { useTranslation } from 'react-i18next';
import { wait } from '../../utilities/wait';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { tunerSettings, tunerAtom } from '../../state/trainer';
import Box from '../../components/BoxTitle/Box';
import { trainingAnimation } from '../../state/animations';
import useWakeLock from '../../hooks/wakeLock';
import { evaluatorAdvanced } from '../../state/evaluatorSettings';
import logger from '../../utilities/logger';
import { useNavigate } from 'react-router-dom';
import BoxNotice, { Notice } from '../../components/BoxTitle/BoxNotice';
import { loadedModelAtom, modelLoRAName } from '../../state/model';
import { conversationDataAtom } from '../../state/data';
import LoRAList from './LoRAList';

const CHECKPT_THRESHOLD = 3_000_000;

export default function TuneTraining() {
    const { t } = useTranslation();
    const [trainer, setTrainer] = useAtom(tunerAtom);
    const [currentStep, setStep] = useState<number>(0);
    const [done, setDone] = useState(true);
    const [training, setTraining] = useState(false);
    const [needsTraining, setNeedsTraining] = useState(true);
    const model = useAtomValue(loadedModelAtom);
    const status = useModelStatus(model ?? undefined);
    const conversations = useAtomValue(conversationDataAtom);
    const settings = useAtomValue(tunerSettings);
    const batchSize = settings.batchSize;
    const setTrainingAnimation = useSetAtom(trainingAnimation);
    const advanced = useAtomValue(evaluatorAdvanced);
    const navigate = useNavigate();
    const [message, setMessage] = useState<Notice | null>(null);
    const [totalSamples, setTotalSamples] = useState(0);
    const [selectedLoRA, setSelectedLoRA] = useAtom(modelLoRAName);

    useWakeLock(training);

    const canTrain =
        !!model && !!conversations && conversations.length > 0 && status !== 'loading' && status !== 'busy';

    useEffect(() => {
        setTrainingAnimation(training);
    }, [training, setTrainingAnimation]);

    useEffect(() => {
        if (trainer) {
            const h = async (log: TrainingLogEntry) => {
                setStep(log.step);

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
            return () => {
                trainer.off('log', h);
            };
        }
    }, [trainer]);

    useEffect(() => {
        if (model) {
            setMessage(null);
            setTrainer(null);
            const h = () => {
                setNeedsTraining(true);
                model.off('loaded', h);
            };
            model.on('loaded', h);
            return () => {
                model.off('loaded', h);
            };
        }
    }, [model, setTrainer]);

    useEffect(() => {
        if (conversations && conversations.length > 0) {
            setNeedsTraining(true);
            setMessage(null);
        }
    }, [conversations]);

    const startTraining = async () => {
        if (training) {
            trainer?.stop();
            setTraining(false);
            return;
        }

        if (!model) {
            setMessage({
                notice: t('training.errors.noModel'),
                level: 'warning',
            });
            return;
        }

        if (!model.hasLoRA()) {
            setMessage({
                notice: t('training.errors.noLoRA'),
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
        if (model && conversations) {
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

            // Patch the settings
            if (useCheckpointing) {
                settings.gradientCheckpointing = true;
            }
            settings.loraName = selectedLoRA ?? undefined;

            const currentTrainer = model.trainer('sft', settings);

            if (!done) {
                // already training
                return;
            }

            setTraining(true);
            setDone(false);

            const shouldPrepare = needsTraining || !currentTrainer.isPrepared();

            setStep(0);
            await wait(200);

            logger.log({ action: 'training_started', modelSize, totalSamples, batchSize });

            model.enableProfiler = advanced;

            if (shouldPrepare) {
                try {
                    const task = new tasks.ConversationTask(conversations);
                    console.log('Preparing trainer with task', conversations);
                    //setPreparing(true);
                    await currentTrainer.prepare([task]);
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

            setTrainer(currentTrainer);
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
                    console.error('Error during training', err);
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
        <Box
            widget="finetuner"
            active={!!model || (!!conversations && conversations.length > 0)}
            style={{ minWidth: '260px', minHeight: '200px' }}
        >
            <div className={style.container}>
                <BoxTitle
                    title={t('finetune.title')}
                    onSettings={() => navigate('tuning-settings')}
                    status={
                        !done ? 'busy' : needsTraining && canTrain ? 'waiting' : !needsTraining ? 'done' : 'disabled'
                    }
                />
                <LoRAList
                    model={model}
                    selected={selectedLoRA}
                    onSelect={setSelectedLoRA}
                    onStop={() => {
                        if (training) {
                            trainer?.stop();
                        }
                    }}
                    progress={training ? currentStep / ((settings.epochSteps || 1) * (settings.maxEpochs || 1)) : null}
                    extraActions={
                        <Button
                            disabled={!done && !training}
                            variant="contained"
                            startIcon={done ? <ModelTrainingIcon /> : <PauseIcon />}
                            onClick={() => startTraining()}
                        >
                            {done ? t('finetune.start') : t('finetune.stop')}
                        </Button>
                    }
                />
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
