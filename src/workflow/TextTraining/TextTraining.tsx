import { Button } from '@genai-fi/base';
import { useEffect, useMemo, useState } from 'react';
import style from './style.module.css';
import { TeachableLLM, TrainingLogEntry } from '@genai-fi/nanogpt';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import useModelStatus from '../../utilities/useModelStatus';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { useTranslation } from 'react-i18next';
import { wait } from '../../utilities/wait';
import { useAtomValue, useSetAtom } from 'jotai';
import {
    trainerBatchSize,
    trainerCheckpointing,
    trainerLearningRate,
    trainerMaxSteps,
} from '../../state/trainerSettings';
import NumberBox from '../../components/NumberBox/NumberBox';
import Box from '../../components/BoxTitle/Box';
import { trainingAnimation } from '../../state/animations';
import Clock from '../../components/Clock/Clock';
import Remaining from './Remaining';

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
    const [trainer, setTrainer] = useState<ReturnType<TeachableLLM['trainer']> | undefined>();
    const [epochs, setEpochs] = useState<number | undefined>(undefined);
    const [done, setDone] = useState(true);
    const [training, setTraining] = useState(false);
    const [needsTraining, setNeedsTraining] = useState(true);
    const status = useModelStatus(model);
    const batchSize = useAtomValue(trainerBatchSize);
    const maxSteps = useAtomValue(trainerMaxSteps);
    const checkpointing = useAtomValue(trainerCheckpointing);
    const learningRate = useAtomValue(trainerLearningRate);
    const setTrainingAnimation = useSetAtom(trainingAnimation);
    const [lr, setLR] = useState(0.0);
    const [trainingProgress, setTrainingProgress] = useState<TrainingProgress | null>(null);

    const canTrain = !!model && !!dataset && dataset.length > 0 && status !== 'loading' && status !== 'busy';

    const totalSamples = useMemo(() => (dataset ? dataset.reduce((acc, curr) => acc + curr.length, 0) : 0), [dataset]);

    useEffect(() => {
        setTrainingAnimation(training);
    }, [training, setTrainingAnimation]);

    useEffect(() => {
        if (trainer) {
            const h = (log: TrainingLogEntry, progress: TrainingProgress) => {
                setEpochs(log.step);
                model?.getProfiler()?.printSummary();
                setTrainingProgress(progress);
            };
            trainer.on('log', h);
            return () => {
                trainer.off('log', h);
            };
        }
    }, [trainer, totalSamples, batchSize, model]);

    useEffect(() => {
        if (model) {
            const h = () => {
                setTrainer(model.trainer());
                setNeedsTraining((old) => old || model.model.log.length === 0);
                model.off('loaded', h);
            };
            model.on('loaded', h);
            return () => {
                model.off('loaded', h);
            };
        }
    }, [model]);

    useEffect(() => {
        if (dataset && dataset.length > 0) {
            setNeedsTraining(true);
        }
    }, [dataset]);

    useEffect(() => {
        if (model && status === 'ready') {
            setLR((cur) => (cur > 0 ? cur : model.model.log.length > 0 ? learningRate * 0.1 : learningRate));
        }
    }, [learningRate, model, status]);

    return (
        <Box
            widget="trainer"
            active={!!model || (!!dataset && dataset.length > 0)}
        >
            <div className={style.container}>
                <BoxTitle
                    title={t('training.title')}
                    status={
                        !done ? 'busy' : needsTraining && canTrain ? 'waiting' : !needsTraining ? 'done' : 'disabled'
                    }
                />
                <div>
                    <Clock
                        duration={trainingProgress?.duration || 0}
                        totalDuration={trainingProgress ? trainingProgress.duration + trainingProgress.remaining : 0}
                    />
                    <div className={style.stats}>
                        <NumberBox
                            value={(epochs || 0) * batchSize}
                            label={t('training.samples')}
                        />
                        <Remaining remaining={trainingProgress?.remaining || 0} />
                    </div>
                </div>
                <div className={style.buttonBox}>
                    <Button
                        fullWidth
                        disabled={!canTrain || (!done && !training)}
                        variant="contained"
                        startIcon={done ? <PlayArrowIcon /> : <PauseIcon />}
                        onClick={async () => {
                            if (model && dataset && trainer) {
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
                                setNeedsTraining(false);
                                // setEpochs(0);
                                await wait(200);
                                model.model.checkpointing = checkpointing;
                                model.enableProfiler = true;
                                trainer
                                    .train(dataset, {
                                        batchSize,
                                        maxSteps,
                                        learningRate: lr > 0 ? lr : learningRate,
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
