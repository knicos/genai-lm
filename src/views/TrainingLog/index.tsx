import { useTranslation } from 'react-i18next';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import style from './style.module.css';
import { EvaluationMetric, evaluatorAdvanced, evaluatorMetrics } from '../../state/evaluatorSettings';
import { useEffect, useState } from 'react';
import useModelLoaded from '../../utilities/useModelLoaded';
import { createMetric } from '../../workflow/Evaluation/Evaluation';
import { TrainingLogEntry, TrainingProgress } from '@genai-fi/nanogpt';
import { modelAtom } from '../../state/model';
import Circle from '../../components/Clock/Circle';
import { qualityToColor } from '../../utilities/colours';
import { FormControl, FormControlLabel, Radio, RadioGroup } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { trainerAtom } from '../../state/trainer';
import { DatasetElementType } from '@mui/x-charts/internals';
import { theme } from '../../theme';
import { deviceCapabilities } from '../../state/device';

interface AdvancedStats {
    samplesPerSecond: number;
    memory: number;
}

export function Component() {
    const { t } = useTranslation();
    const [metricValue, setMetricValue] = useState<number>(0);
    const [metricPercentage, setMetricPercentage] = useState<number>(0);
    const model = useAtomValue(modelAtom);
    const ready = useModelLoaded(model ?? undefined);
    const [metric, setMetric] = useAtom(evaluatorMetrics);
    const setAdvanced = useSetAtom(evaluatorAdvanced);
    const [advancedStats, setAdvancedStats] = useState<AdvancedStats | null>(null);
    const trainer = useAtomValue(trainerAtom);
    const shouldAnimate = useAtomValue(deviceCapabilities)?.backend === 'webgpu';

    useEffect(() => {
        setAdvanced(true);
        return () => {
            setAdvanced(false);
        };
    }, [setAdvanced]);

    useEffect(() => {
        if (model) {
            const h = (log: TrainingLogEntry, progress: TrainingProgress) => {
                const { value, percentage } = createMetric(metric, log, model.config.vocabSize);
                setMetricValue(value);
                setMetricPercentage(percentage);

                setAdvancedStats({
                    samplesPerSecond: progress.samplesPerSecond,
                    memory: progress.memory ?? 0,
                });
            };
            model.on('trainStep', h);

            return () => {
                model.off('trainStep', h);
            };
        }
    }, [model, metric]);

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
        <div className="sidePanel">
            <h2>{t('tools.training.title')}</h2>
            <h3 className={style.subtitle}>{t('tools.training.validation')}</h3>
            <div className={style.validationBox}>
                <Circle
                    radius={65}
                    progress={metricPercentage}
                    color={qualityToColor(metricPercentage)}
                    animated={shouldAnimate}
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
                <FormControl>
                    <RadioGroup
                        aria-label={t('app.settings.evaluationMetrics')}
                        defaultValue="image"
                        name="radio-buttons-group"
                        value={metric}
                        onChange={(_, value) => setMetric(value as EvaluationMetric)}
                    >
                        <FormControlLabel
                            value="quality"
                            control={<Radio />}
                            label={t('app.settings.qualityMetric')}
                        />
                        <FormControlLabel
                            value="perplexity"
                            control={<Radio />}
                            label={t('app.settings.perplexityMetric')}
                        />
                        <FormControlLabel
                            value="loss"
                            control={<Radio />}
                            label={t('app.settings.lossMetric')}
                        />
                    </RadioGroup>
                </FormControl>
            </div>
            <h3 className={style.subtitle}>{t('tools.training.history')}</h3>
            <div className={style.chartContainer}>
                <LineChart
                    skipAnimation={!shouldAnimate}
                    localeText={{ noData: t('training.noData') }}
                    dataset={(trainer?.getLog() ?? []) as unknown as DatasetElementType<number>[]}
                    series={[
                        {
                            dataKey: 'valLoss',
                            showMark: false,
                            label: t('training.valLoss'),
                            color: theme.light.chartColours[4],
                            id: 'valLoss',
                        },
                        {
                            dataKey: 'loss',
                            showMark: false,
                            label: t('training.loss'),
                            color: theme.light.chartColours[1],
                            id: 'loss',
                        },
                    ]}
                    height={250}
                    yAxis={[{ label: t('training.loss') }]}
                    xAxis={[{ label: t('training.steps'), tickNumber: 5, dataKey: 'step' }]}
                />
            </div>
            <h3 className={style.subtitle}>{t('tools.training.performance')}</h3>
            <div className={style.advanced}>
                <div className={style.advancedItem}>
                    <div className={style.advancedLabel}>{t('evaluation.samplesPerSecond')}</div>
                    <div className={style.advancedValue}>{advancedStats?.samplesPerSecond.toFixed(0) ?? 0}</div>
                </div>
                <div className={style.advancedItem}>
                    <div className={style.advancedLabel}>{t('evaluation.memory')}</div>
                    <div className={style.advancedValue}>
                        {((advancedStats?.memory ?? 0) / 1024 / 1024 / 1024).toFixed(2)} GB
                    </div>
                </div>
            </div>
        </div>
    );
}
