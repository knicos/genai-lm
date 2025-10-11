import { Checkbox, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, Slider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAtom } from 'jotai';
import style from './style.module.css';
import {
    trainerBatchSize,
    trainerCheckpointing,
    trainerLearningRate,
    trainerOutputText,
} from '../../state/trainerSettings';
import { EvaluationMetric, evaluatorAdvanced, evaluatorMetrics } from '../../state/evaluatorSettings';

export default function TrainingSettings() {
    const { t } = useTranslation();
    const [batchSize, setBatchSize] = useAtom(trainerBatchSize);
    const [learningRate, setLearningRate] = useAtom(trainerLearningRate);
    const [outputText, setOutputText] = useAtom(trainerOutputText);
    const [checkpointing, setCheckpointing] = useAtom(trainerCheckpointing);
    const [metric, setMetric] = useAtom(evaluatorMetrics);
    const [advanced, setAdvanced] = useAtom(evaluatorAdvanced);

    return (
        <div className={style.column}>
            <FormControl sx={{ marginTop: '1rem' }}>
                <div
                    id="batch-label"
                    className={style.label}
                >
                    {t('app.settings.batchSize')}
                </div>
                <Slider
                    aria-labelledby="batch-label"
                    value={batchSize}
                    onChange={(_, value) => setBatchSize(value as number)}
                    min={4}
                    max={64}
                    step={4}
                    valueLabelDisplay="auto"
                />
            </FormControl>
            <FormControl sx={{ marginTop: '1rem' }}>
                <div
                    id="learningRate-label"
                    className={style.label}
                >
                    {t('app.settings.learningRate')}
                </div>
                <Slider
                    aria-labelledby="learningRate-label"
                    value={learningRate}
                    onChange={(_, value) => setLearningRate(value as number)}
                    min={0.0001}
                    max={0.01}
                    step={0.0001}
                    valueLabelDisplay="auto"
                />
            </FormControl>
            <div className={style.spacer} />
            <FormControl sx={{ marginTop: '1rem' }}>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={outputText}
                            onChange={(_, checked) => setOutputText(checked)}
                        />
                    }
                    label={t('app.settings.showOutputText')}
                />
            </FormControl>
            <FormControl>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={checkpointing}
                            onChange={(_, checked) => setCheckpointing(checked)}
                        />
                    }
                    label={t('app.settings.checkpointing')}
                />
            </FormControl>
            <FormControl sx={{ marginTop: '1rem' }}>
                <FormLabel id="metric-group-label">{t('app.settings.evaluationMetrics')}</FormLabel>
                <RadioGroup
                    aria-labelledby="metric-group-label"
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
            <FormControl sx={{ marginTop: '1rem' }}>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={advanced}
                            onChange={(_, checked) => setAdvanced(checked)}
                        />
                    }
                    label={t('app.settings.advancedMetrics')}
                />
            </FormControl>
        </div>
    );
}
