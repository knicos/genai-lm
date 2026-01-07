import { TeachableLLM, TrainingLogEntry } from '@genai-fi/nanogpt';
import style from './style.module.css';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Circle from '../../components/Clock/Circle';
import { qualityToColor } from '../../utilities/colours';
import { useAtomValue } from 'jotai';
import { EvaluationMetric, evaluatorAdvanced, evaluatorMetrics } from '../../state/evaluatorSettings';
import Box from '../../components/BoxTitle/Box';
import useModelLoaded from '../../utilities/useModelLoaded';

interface TrainingProgress {
    duration: number;
    totalSamples: number;
    samplesPerSecond: number;
    memory?: number;
}

function lossToQuality(loss: number, vocabSize: number): number {
    const targetLoss = 0.3;
    const maxReasonableLoss = Math.log(vocabSize) * 0.8;
    const clampedLoss = Math.max(targetLoss, Math.min(loss, maxReasonableLoss));
    const normalizedLoss = (clampedLoss - targetLoss) / (maxReasonableLoss - targetLoss);

    const k = 3; // Higher k makes quality stay low longer, then jump rapidly near target
    const quality = Math.exp(-k * normalizedLoss);

    return Math.max(0, Math.min(1, quality));
}

export function createMetric(
    metric: EvaluationMetric,
    log: { valLoss?: number; loss: number },
    vocabSize: number
): { value: number; percentage: number } {
    const maxLoss = Math.log(vocabSize);
    let percentage = Math.max(0, Math.min(1, (maxLoss - (log.valLoss ?? log.loss)) / maxLoss));

    switch (metric) {
        case 'loss':
            return { value: log.valLoss ?? log.loss, percentage };
        case 'perplexity':
            return { value: Math.exp(log.valLoss ?? log.loss), percentage };
        case 'quality':
            percentage = lossToQuality(log.valLoss ?? log.loss, vocabSize);
            return { value: percentage, percentage };
        default:
            return { value: 0, percentage };
    }
}

interface AdvancedStats {
    samplesPerSecond: number;
    memory: number;
}

interface Props {
    model?: TeachableLLM;
}

export default function Evaluation({ model }: Props) {
    const { t } = useTranslation();
    const [metricValue, setMetricValue] = useState<number>(0);
    const [metricPercentage, setMetricPercentage] = useState<number>(0);
    const ready = useModelLoaded(model);
    const metric = useAtomValue(evaluatorMetrics);
    const advanced = useAtomValue(evaluatorAdvanced);
    const [advancedStats, setAdvancedStats] = useState<AdvancedStats | null>(null);

    useEffect(() => {
        if (model) {
            const h = (log: TrainingLogEntry, progress: TrainingProgress) => {
                const { value, percentage } = createMetric(metric, log, model.config.vocabSize);
                setMetricValue(value);
                setMetricPercentage(percentage);

                if (advanced) {
                    setAdvancedStats({
                        samplesPerSecond: progress.samplesPerSecond,
                        memory: progress.memory ?? 0,
                    });
                }
            };
            model.on('trainStep', h);
            return () => {
                model.off('trainStep', h);
            };
        }
    }, [model, metric, advanced]);

    useEffect(() => {
        if (model && ready && model.model.trainingState) {
            const lastLog = model.model.trainingState;
            const { value, percentage } = createMetric(metric, lastLog, model.config.vocabSize);
            setMetricValue(value);
            setMetricPercentage(percentage);
        } else {
            setMetricValue(0);
            setMetricPercentage(0);
        }
    }, [model, ready, metric]);

    return (
        <Box widget="evaluation">
            <div className={style.container}>
                <BoxTitle
                    title={t('evaluation.title')}
                    status={!!model && metricPercentage > 0 ? 'done' : 'disabled'}
                />
                <div style={{ marginBottom: '1rem' }} />
                <Circle
                    radius={55}
                    progress={metricPercentage}
                    color={qualityToColor(metricPercentage)}
                >
                    {metric === 'quality' && (
                        <>
                            <div
                                className={style.value}
                                data-testid="quality-value"
                            >
                                {`${Math.round(metricValue * 100)}`}
                                <span className={style.percentage}>%</span>
                            </div>
                            <div className={style.label}>{t('evaluation.quality')}</div>
                        </>
                    )}
                    {metric === 'perplexity' && (
                        <>
                            <div className={style.value}>{`${metricValue.toFixed(2)}`}</div>
                            <div className={style.label}>{t('evaluation.perplexity')}</div>
                        </>
                    )}
                    {metric === 'loss' && (
                        <>
                            <div className={style.value}>{`${metricValue.toFixed(2)}`}</div>
                            <div className={style.label}>{t('evaluation.loss')}</div>
                        </>
                    )}
                </Circle>
                {advanced && advancedStats && (
                    <div className={style.advanced}>
                        <div className={style.advancedItem}>
                            <div className={style.advancedLabel}>{t('evaluation.samplesPerSecond')}</div>
                            <div className={style.advancedValue}>{advancedStats.samplesPerSecond.toFixed(0)}</div>
                        </div>
                        <div className={style.advancedItem}>
                            <div className={style.advancedLabel}>{t('evaluation.memory')}</div>
                            <div className={style.advancedValue}>
                                {(advancedStats.memory / 1024 / 1024 / 1024).toFixed(2)} GB
                            </div>
                        </div>
                    </div>
                )}
                <div style={{ marginBottom: '1rem' }} />
            </div>
        </Box>
    );
}
