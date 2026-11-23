import { Button } from '@genai-fi/base';
import { useEffect, useState } from 'react';
import style from './style.module.css';
import { ITrainingJob, data as dataModule, TrainingLogEntry } from '@genai-fi/nanogpt';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import useModelStatus from '../../hooks/useModelStatus';
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';
import PauseIcon from '@mui/icons-material/Pause';
import { useTranslation } from 'react-i18next';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { tunerSettings, tunerJobIdAtom } from '../../state/trainer';
import Box from '../../components/BoxTitle/Box';
import { trainingAnimation } from '../../state/animations';
import useWakeLock from '../../hooks/wakeLock';
import { useNavigate } from 'react-router';
import BoxNotice, { Notice } from '../../components/BoxTitle/BoxNotice';
import { loadedModelAtom, modelLoRAName } from '../../state/model';
import { conversationDataAtom } from '../../state/data';
import LoRAList from './LoRAList';

const CHECKPT_THRESHOLD = 3_000_000;

export default function TuneTraining() {
    const { t } = useTranslation();
    const [trainerJobId, setTrainerJobId] = useAtom(tunerJobIdAtom);
    const [currentStep, setStep] = useState<number>(0);
    const [done, setDone] = useState(true);
    const [training, setTraining] = useState(false);
    const [needsTraining, setNeedsTraining] = useState(true);
    const model = useAtomValue(loadedModelAtom);
    const status = useModelStatus(model ?? undefined);
    const conversations = useAtomValue(conversationDataAtom);
    const settings = useAtomValue(tunerSettings);
    const setTrainingAnimation = useSetAtom(trainingAnimation);
    const navigate = useNavigate();
    const [message, setMessage] = useState<Notice | null>(null);
    const [selectedLoRA, setSelectedLoRA] = useAtom(modelLoRAName);

    useWakeLock(training);

    const canTrain =
        !!model && !!conversations && conversations.length > 0 && status !== 'loading' && status !== 'busy';

    useEffect(() => {
        setTrainingAnimation(training);
    }, [training, setTrainingAnimation]);

    useEffect(() => {
        if (model && trainerJobId) {
            const h = async (job: ITrainingJob) => {
                if (job.id !== trainerJobId) return;
                const log = job.history ? (job.history[job.history.length - 1] as TrainingLogEntry) : null;
                if (!log) return;
                setStep(log.step);
            };
            model.training.on('progress', h);
            return () => {
                model.training.off('progress', h);
            };
        }
    }, [model, trainerJobId]);

    useEffect(() => {
        if (model) {
            setMessage(null);
            setTrainerJobId(null);
            const h = () => {
                setNeedsTraining(true);
                model.off('loaded', h);
            };
            model.on('loaded', h);
            return () => {
                model.off('loaded', h);
            };
        }
    }, [model, setTrainerJobId]);

    useEffect(() => {
        if (conversations && conversations.length > 0) {
            setNeedsTraining(true);
            setMessage(null);
        }
    }, [conversations]);

    const startTraining = async () => {
        if (training && trainerJobId && model) {
            model?.training.cancel(trainerJobId);
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
            settings.previous_job_id = trainerJobId ?? undefined;

            try {
                const job = await model.training.job(
                    settings,
                    [new dataModule.MemoryConversationStream(conversations)],
                    [{ id: 'conversations_log', name: 'Conversations Log', conversational: true }]
                );

                if (!job) {
                    return;
                }

                const errorHandler = (id: string) => {
                    if (id === job.id) {
                        setDone(true);
                        setTraining(false);
                        model.training.off('error', errorHandler);
                        setMessage({
                            notice: t('training.errors.trainingFailed'),
                            level: 'error',
                        });
                    }
                };
                model.training.on('error', errorHandler);

                const doneHandler = async (jobId: string) => {
                    if (jobId === job.id) {
                        setDone(true);
                        setTraining(false);
                        model.training.off('completed', doneHandler);
                        model.training.off('cancelled', doneHandler);
                        model.training.off('error', errorHandler);
                    }
                };
                model.training.on('completed', doneHandler);
                model.training.on('cancelled', doneHandler);

                setTraining(true);
                setDone(false);

                setStep(0);

                setNeedsTraining(false);
                setTrainerJobId(job.id);
            } catch (err) {
                console.error('Error starting training', err);
                setMessage({
                    notice: t('training.errors.trainingFailed'),
                    level: 'error',
                });
            }
        }
    };

    return (
        <Box
            widget="finetuner"
            active={!!model || (!!conversations && conversations.length > 0)}
            style={{ minWidth: '260px', minHeight: '200px' }}
            deactivateOnAudit
        >
            <div className={style.container}>
                <BoxTitle
                    title={t('finetune.title')}
                    onSettings={() => navigate('training-settings')}
                    status={
                        !done ? 'busy' : needsTraining && canTrain ? 'waiting' : !needsTraining ? 'done' : 'disabled'
                    }
                />
                <LoRAList
                    model={model}
                    selected={selectedLoRA}
                    onSelect={setSelectedLoRA}
                    onStop={() => {
                        if (training && trainerJobId && model) {
                            model.training.cancel(trainerJobId);
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
