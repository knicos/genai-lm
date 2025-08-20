import { Button } from '@genai-fi/base';
import { useEffect, useState } from 'react';
import style from './style.module.css';
import { TeachableLLM, TrainingLogEntry } from '@genai-fi/nanogpt';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import useModelStatus from '../../utilities/useModelStatus';
import prettyNumber from '../../utilities/prettyNumber';
import { IconButton } from '@mui/material';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import { useTranslation } from 'react-i18next';
import { wait } from '../../utilities/wait';
import { useAtomValue } from 'jotai';
import { trainerBatchSize, trainerLearningRate, trainerMaxSteps } from '../../state/trainerSettings';

interface Props {
    model?: TeachableLLM;
    dataset?: string[];
}

export default function TextTraining({ model, dataset }: Props) {
    const { t } = useTranslation();
    const [trainer, setTrainer] = useState<ReturnType<TeachableLLM['trainer']> | undefined>();
    const [epochs, setEpochs] = useState<number | undefined>(undefined);
    const [done, setDone] = useState(true);
    const status = useModelStatus(model);
    const batchSize = useAtomValue(trainerBatchSize);
    const maxSteps = useAtomValue(trainerMaxSteps);
    const learningRate = useAtomValue(trainerLearningRate);

    const canTrain = !!model && !!dataset && status === 'ready' && dataset.length > 0;

    useEffect(() => {
        if (trainer) {
            const h = (log: TrainingLogEntry) => {
                setEpochs(log.step);
            };
            trainer.on('log', h);
            return () => {
                trainer.off('log', h);
            };
        }
    }, [trainer]);

    useEffect(() => {
        if (model) {
            if (model.status === 'ready') {
                setTrainer(model.trainer());
            } else {
                const h = (s: string) => {
                    if (s === 'ready') {
                        setTrainer(model.trainer());
                        model.off('status', h);
                    }
                };
                model.on('status', h);
                return () => {
                    model.off('status', h);
                };
            }
        }
    }, [model]);

    return (
        <div className={style.container}>
            <BoxTitle
                title={t('training.title')}
                done={canTrain}
                busy={!done}
            />
            {`${prettyNumber((epochs || 0) * batchSize)} ${t('training.samples')}`}

            <div className={style.buttonBox}>
                <Button
                    disabled={!canTrain || !model}
                    variant="contained"
                    onClick={async () => {
                        if (model && dataset && trainer) {
                            if (!model.tokeniser.trained) {
                                await model.tokeniser.train(dataset);
                            }

                            setDone(false);
                            setEpochs(0);
                            await wait(10);
                            trainer
                                .train(dataset, {
                                    batchSize,
                                    maxSteps,
                                    learningRate,
                                })
                                .then(() => {
                                    setDone(true);
                                });
                        }
                    }}
                >
                    {t('training.start')}
                </Button>
                <IconButton
                    onClick={() => {
                        if (trainer) {
                            trainer.stop();
                            setDone(true);
                        }
                    }}
                    disabled={status !== 'training' || !trainer}
                    color="secondary"
                >
                    <StopCircleIcon fontSize="large" />
                </IconButton>
            </div>
        </div>
    );
}
