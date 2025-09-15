import { Button } from '@genai-fi/base';
import { useEffect, useState } from 'react';
import style from './style.module.css';
import { TeachableLLM, TrainingLogEntry } from '@genai-fi/nanogpt';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import useModelStatus from '../../utilities/useModelStatus';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { useTranslation } from 'react-i18next';
import { wait } from '../../utilities/wait';
import { useAtomValue, useSetAtom } from 'jotai';
import { trainerBatchSize, trainerLearningRate, trainerMaxSteps } from '../../state/trainerSettings';
import NumberBox from '../../components/NumberBox/NumberBox';
import Box from '../../components/BoxTitle/Box';
import { trainingAnimation } from '../../state/animations';

interface Props {
    model?: TeachableLLM;
    dataset?: string[];
}

export default function TextTraining({ model, dataset }: Props) {
    const { t } = useTranslation();
    const [trainer, setTrainer] = useState<ReturnType<TeachableLLM['trainer']> | undefined>();
    const [epochs, setEpochs] = useState<number | undefined>(undefined);
    const [done, setDone] = useState(true);
    const [training, setTraining] = useState(false);
    const status = useModelStatus(model);
    const batchSize = useAtomValue(trainerBatchSize);
    const maxSteps = useAtomValue(trainerMaxSteps);
    const learningRate = useAtomValue(trainerLearningRate);
    const setTrainingAnimation = useSetAtom(trainingAnimation);

    const canTrain = !!model && !!dataset && dataset.length > 0;

    useEffect(() => {
        setTrainingAnimation(training);
    }, [training, setTrainingAnimation]);

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
        <Box
            widget="trainer"
            active={!!model || (!!dataset && dataset.length > 0)}
        >
            <div className={style.container}>
                <BoxTitle
                    title={t('training.title')}
                    done={status === 'ready' && canTrain}
                    busy={!done}
                />
                <NumberBox
                    value={(epochs || 0) * batchSize}
                    label={t('training.samples')}
                />

                <div className={style.buttonBox}>
                    <Button
                        fullWidth
                        disabled={!canTrain || (!done && !training)}
                        variant="contained"
                        startIcon={done ? <PlayArrowIcon /> : <PauseIcon />}
                        onClick={async () => {
                            if (model && dataset && trainer) {
                                if (!model.tokeniser.trained) {
                                    await model.tokeniser.train(dataset);
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
                                // setEpochs(0);
                                await wait(10);
                                trainer
                                    .train(dataset, {
                                        batchSize,
                                        maxSteps,
                                        learningRate,
                                    })
                                    .then(() => {
                                        setDone(true);
                                        setTraining(false);
                                    });
                            }
                        }}
                    >
                        {done ? t('training.start') : t('training.stop')}
                    </Button>
                </div>
            </div>
        </Box>
    );
}
