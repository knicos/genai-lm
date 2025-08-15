import { Button } from '@genai-fi/base';
import { useEffect, useState } from 'react';
import style from './style.module.css';
import { TeachableLLM, TrainingLogEntry } from '@genai-fi/nanogpt';
import BoxTitle from '../BoxTitle/BoxTitle';
import useModelStatus from '../../utilities/useModelStatus';
import prettyNumber from '../../utilities/prettyNumber';
import { IconButton } from '@mui/material';
import StopCircleIcon from '@mui/icons-material/StopCircle';

interface Props {
    model?: TeachableLLM;
    dataset?: string[];
}

export default function TextTraining({ model, dataset }: Props) {
    const [trainer, setTrainer] = useState<ReturnType<TeachableLLM['trainer']> | undefined>();
    const [epochs, setEpochs] = useState<number | undefined>(undefined);
    const [done, setDone] = useState(false);
    const status = useModelStatus(model);

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

    return (
        <div className={style.container}>
            <BoxTitle
                title="Training"
                done={done}
                busy={!done && !!trainer}
            />
            {`${prettyNumber((epochs || 0) * 32)} samples`}

            <div className={style.buttonBox}>
                <Button
                    disabled={!canTrain || !model}
                    variant="contained"
                    onClick={async () => {
                        if (model && dataset) {
                            if (!model.tokeniser.trained) {
                                await model.tokeniser.train(dataset);
                            }
                            const newTrainer = model.trainer();
                            setTrainer(newTrainer);
                            setDone(false);
                            setEpochs(0);
                            newTrainer
                                .train(dataset, {
                                    batchSize: 32,
                                    maxSteps: 300,
                                })
                                .then(() => {
                                    setDone(true);
                                });
                        }
                    }}
                >
                    Train
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
