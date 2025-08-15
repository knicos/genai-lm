import { TeachableLLM, TrainingLogEntry } from '@genai-fi/nanogpt';
import style from './style.module.css';
import BoxTitle from '../BoxTitle/BoxTitle';
import ScoreGauge from '../ScoreGauge/ScoreGauge';
import { useEffect, useState } from 'react';
import useModelStatus from '../../utilities/useModelStatus';

function lossToQuality(loss: number, vocabSize: number): number {
    const targetLoss = 1;
    const maxReasonableLoss = Math.log(vocabSize) * 0.8;
    const clampedLoss = Math.max(targetLoss, Math.min(loss, maxReasonableLoss));
    const normalizedLoss = (clampedLoss - targetLoss) / (maxReasonableLoss - targetLoss);

    const k = 3; // Higher k makes quality stay low longer, then jump rapidly near target
    const quality = Math.exp(-k * normalizedLoss);

    return Math.max(0, Math.min(1, quality));
}

function qualityToColor(quality: number): string {
    // Clamp quality between 0 and 1
    const clampedQuality = Math.max(0, Math.min(1, quality));

    // Red component: starts at 255 (full red) and decreases to 0
    const red = Math.round(255 * (1 - clampedQuality));

    // Green component: starts at 0 and increases to 255 (full green)
    const green = Math.round(255 * clampedQuality);

    // Blue component: stays at 0 for a pure red-to-green transition
    const blue = 0;

    return `rgb(${red}, ${green}, ${blue})`;
}

interface Props {
    model?: TeachableLLM;
}

export default function Evaluation({ model }: Props) {
    const [quality, setQuality] = useState<number>(0);
    const status = useModelStatus(model);

    useEffect(() => {
        if (model) {
            const h = (log: TrainingLogEntry) => {
                setQuality(lossToQuality(log.valLoss ?? log.loss, model?.config.vocabSize || 1));
            };
            model.on('trainStep', h);
            return () => {
                model.off('trainStep', h);
            };
        }
    }, [model]);

    useEffect(() => {
        if (model && status === 'ready' && model.model.log) {
            const log = model.model.log;
            const lastLog = log[log.length - 1];
            if (lastLog) {
                setQuality(lossToQuality(lastLog.valLoss ?? lastLog.loss, model.config.vocabSize));
            } else {
                setQuality(0);
            }
        }
    }, [model, status]);

    return (
        <div className={style.container}>
            <BoxTitle
                title="Evaluation"
                info
                done={!!model}
            />
            <div style={{ marginBottom: '1rem' }} />
            <ScoreGauge
                label="Quality"
                value={quality}
                maxValue={1}
                showValue
                color={qualityToColor(quality)}
            />
            <div style={{ marginBottom: '1rem' }} />
        </div>
    );
}
