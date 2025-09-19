import { TeachableLLM, TrainingLogEntry } from '@genai-fi/nanogpt';
import style from './style.module.css';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import { useEffect, useState } from 'react';
import useModelStatus from '../../utilities/useModelStatus';
import { useTranslation } from 'react-i18next';
import Circle from '../../components/Clock/Circle';

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
    // Interpolate between light gray and brand color based on quality
    const brand = { r: 76, g: 175, b: 80 };
    const gray = { r: 200, g: 200, b: 200 }; // Light gray

    const r = Math.round(gray.r + (brand.r - gray.r) * quality);
    const g = Math.round(gray.g + (brand.g - gray.g) * quality);
    const b = Math.round(gray.b + (brand.b - gray.b) * quality);

    return `rgb(${r}, ${g}, ${b})`;
}

interface Props {
    model?: TeachableLLM;
}

export default function Evaluation({ model }: Props) {
    const { t } = useTranslation();
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
                title={t('evaluation.title')}
                done={!!model && quality > 0}
                info
            />
            <div style={{ marginBottom: '1rem' }} />
            <Circle
                radius={55}
                progress={quality}
                color={qualityToColor(quality)}
            >
                <div className={style.value}>
                    {`${Math.round(quality * 100)}`}
                    <span className={style.percentage}>%</span>
                </div>
                <div className={style.label}>{t('evaluation.quality')}</div>
            </Circle>
            <div style={{ marginBottom: '1rem' }} />
        </div>
    );
}
