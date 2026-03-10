import { useTranslation } from 'react-i18next';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import style from './style.module.css';
import { EvaluationMetric, evaluatorAdvanced, evaluatorMetrics } from '../../state/evaluatorSettings';
import { useEffect, useRef, useState } from 'react';
import { TrainingLogEntry } from '@genai-fi/nanogpt';
import { modelAtom } from '../../state/model';
import Circle from '../../components/Clock/Circle';
import { qualityToColor } from '../../utilities/colours';
import { FormControl, FormControlLabel, Radio, RadioGroup } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { DatasetElementType } from '@mui/x-charts/internals';
import { theme } from '../../theme';
import { deviceCapabilities } from '../../state/device';
import { CollapsedTrainingLog, CollapsedTrainingPoint } from './CollapsedTrainingLog';
import { createMetric } from '../../utilities/metric';
import { trainerAtom } from '../../state/trainer';
import { uiDeveloperMode } from '../../state/uiState';
import Help from '../../components/Help/Help';

interface AdvancedStats {
    samplesPerSecond: number;
    memory: number;
}

export function Component() {
    const { t } = useTranslation();
    const model = useAtomValue(modelAtom);
    const trainer = useAtomValue(trainerAtom);
    const trainerLog = trainer?.log;
    const [metric, setMetric] = useAtom(evaluatorMetrics);

    const [metricValue, setMetricValue] = useState<number>(0);
    const [metricPercentage, setMetricPercentage] = useState<number>(0);

    const setAdvanced = useSetAtom(evaluatorAdvanced);
    const [advancedStats, setAdvancedStats] = useState<AdvancedStats | null>(null);
    const shouldAnimate = useAtomValue(deviceCapabilities)?.backend === 'webgpu';
    const aggregatorRef = useRef(new CollapsedTrainingLog(1));
    const [history, setHistory] = useState<CollapsedTrainingPoint[]>([]);
    const devMode = useAtomValue(uiDeveloperMode);

    useEffect(() => {
        setAdvanced(true);
        return () => {
            setAdvanced(false);
        };
    }, [setAdvanced]);

    useEffect(() => {
        if (model) {
            const h = (log: TrainingLogEntry) => {
                const { value, percentage } = createMetric(metric, log, model.config.vocabSize);
                setMetricValue(value);
                setMetricPercentage(percentage);

                setAdvancedStats({
                    samplesPerSecond: log.samplesPerSecond,
                    memory: log.memoryUsage ?? 0,
                });

                aggregatorRef.current.push({
                    step: log.step,
                    trainingLoss: log.trainingMetrics.loss,
                    validationLoss: log.validationMetrics?.loss ?? 0,
                    trainingPerplexity: log.trainingMetrics.perplexity,
                    validationPerplexity: log.validationMetrics?.perplexity,
                    trainingAccuracy: log.trainingMetrics.accuracy,
                    validationAccuracy: log.validationMetrics?.accuracy,
                    gradientNorm: log.gradientNorm,
                    count: 1,
                });

                const newHistory = aggregatorRef.current.getCollapsed();
                setHistory(newHistory);

                if (newHistory.length > 100) {
                    // cap history to 100 points to keep graph responsive.
                    aggregatorRef.current.setGroupSize(aggregatorRef.current.getGroupSize() * 2);
                    setHistory(aggregatorRef.current.getCollapsed());
                }
            };
            model.on('trainStep', h);

            return () => {
                model.off('trainStep', h);
            };
        }
    }, [model, metric]);

    useEffect(() => {
        if (trainerLog && trainerLog.length > 0) {
            aggregatorRef.current = new CollapsedTrainingLog(
                1,
                trainerLog.map((entry) => ({
                    step: entry.step,
                    trainingLoss: entry.trainingMetrics.loss,
                    validationLoss: entry.validationMetrics?.loss ?? 0,
                    trainingPerplexity: entry.trainingMetrics.perplexity,
                    validationPerplexity: entry.validationMetrics?.perplexity,
                    trainingAccuracy: entry.trainingMetrics.accuracy,
                    validationAccuracy: entry.validationMetrics?.accuracy,
                    gradientNorm: entry.gradientNorm,
                    count: 1,
                }))
            );

            setHistory(aggregatorRef.current.getCollapsed());
        } else {
            setMetricValue(0);
            setMetricPercentage(0);
            setHistory([]);
        }
    }, [trainerLog]);

    useEffect(() => {
        if (trainerLog && trainerLog.length > 0 && model && model.loaded) {
            const log = trainerLog[trainerLog.length - 1];
            const { value, percentage } = createMetric(metric, log, model.config.vocabSize);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setMetricValue(value);
            setMetricPercentage(percentage);

            setAdvancedStats({
                samplesPerSecond: log.samplesPerSecond,
                memory: log.memoryUsage ?? 0,
            });
        }
    }, [metric, trainerLog, model]);

    return (
        <div className="sidePanel">
            <h2>{t('tools.training.title')}</h2>

            <h3 className={style.subtitle}>
                <Help
                    message={t('tools.training.validationHelp')}
                    inplace
                >
                    {t('tools.training.validation')}
                </Help>
            </h3>

            <div className={style.validationBox}>
                <Circle
                    radius={65}
                    progress={metricPercentage}
                    color={qualityToColor(metricPercentage)}
                    animated={shouldAnimate}
                >
                    {metric === 'gradientNorm' && (
                        <>
                            <div className={style.value}>{`${metricValue.toFixed(2)}`}</div>
                            <div className={style.label}>{t('evaluation.gradientNorm')}</div>
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
                    {metric === 'accuracy' && (
                        <>
                            <div className={style.value}>{`${(metricValue * 100).toFixed(0)}%`}</div>
                            <div className={style.label}>{t('evaluation.accuracy')}</div>
                        </>
                    )}
                </Circle>
                <FormControl>
                    <RadioGroup
                        aria-label={t('app.settings.evaluationMetrics')}
                        defaultValue="image"
                        name="radio-buttons-group"
                        value={metric}
                        onChange={(_, value) => {
                            setMetric(value as EvaluationMetric);
                            setMetricValue(0);
                            setMetricPercentage(0);
                        }}
                    >
                        {devMode && (
                            <FormControlLabel
                                value="gradientNorm"
                                control={<Radio />}
                                label={t('app.settings.gradientNormMetric')}
                            />
                        )}
                        <Help
                            message={t('tools.training.accuracyHelp')}
                            inplace
                            placement="left"
                        >
                            <FormControlLabel
                                value="accuracy"
                                control={<Radio />}
                                label={t('app.settings.accuracyMetric')}
                            />
                        </Help>
                        {devMode && (
                            <FormControlLabel
                                value="perplexity"
                                control={<Radio />}
                                label={t('app.settings.perplexityMetric')}
                            />
                        )}
                        <Help
                            message={t('tools.training.lossHelp')}
                            inplace
                            placement="left"
                        >
                            <FormControlLabel
                                value="loss"
                                control={<Radio />}
                                label={t('app.settings.lossMetric')}
                            />
                        </Help>
                    </RadioGroup>
                </FormControl>
            </div>
            <h3 className={style.subtitle}>{t('tools.training.history')}</h3>
            <div className={style.chartContainer}>
                <LineChart
                    skipAnimation={true}
                    localeText={{ noData: t('training.noData') }}
                    dataset={history as unknown as DatasetElementType<number>[]}
                    series={
                        metric === 'loss'
                            ? [
                                  {
                                      dataKey: 'validationLoss',
                                      showMark: false,
                                      label: t('training.valLoss'),
                                      color: theme.light.chartColours[4],
                                      id: 'valLoss',
                                  },
                                  {
                                      dataKey: 'trainingLoss',
                                      showMark: false,
                                      label: t('training.loss'),
                                      color: theme.light.chartColours[1],
                                      id: 'loss',
                                  },
                              ]
                            : metric === 'perplexity'
                              ? [
                                    {
                                        dataKey: 'validationPerplexity',
                                        showMark: false,
                                        label: t('training.valPerplexity'),
                                        color: theme.light.chartColours[4],
                                        id: 'valPerplexity',
                                    },
                                    {
                                        dataKey: 'trainingPerplexity',
                                        showMark: false,
                                        label: t('training.perplexity'),
                                        color: theme.light.chartColours[1],
                                        id: 'perplexity',
                                    },
                                ]
                              : metric === 'gradientNorm'
                                ? [
                                      {
                                          dataKey: 'gradientNorm',
                                          showMark: false,
                                          label: t('training.gradientNorm'),
                                          color: theme.light.chartColours[1],
                                          id: 'gradientNorm',
                                      },
                                  ]
                                : metric === 'accuracy'
                                  ? [
                                        {
                                            dataKey: 'validationAccuracy',
                                            showMark: false,
                                            label: t('training.valAccuracy'),
                                            color: theme.light.chartColours[4],
                                            id: 'valAccuracy',
                                        },
                                        {
                                            dataKey: 'trainingAccuracy',
                                            showMark: false,
                                            label: t('training.accuracy'),
                                            color: theme.light.chartColours[1],
                                            id: 'accuracy',
                                        },
                                    ]
                                  : []
                    }
                    height={250}
                    yAxis={[
                        {
                            label:
                                metric === 'loss'
                                    ? t('training.loss')
                                    : metric === 'perplexity'
                                      ? t('training.perplexity')
                                      : metric === 'accuracy'
                                        ? t('training.accuracy')
                                        : t('training.gradientNorm'),
                            tickNumber: 5,
                        },
                    ]}
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
