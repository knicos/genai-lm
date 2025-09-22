import { Checkbox, FormControl, FormControlLabel, Slider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAtom } from 'jotai';
import style from './style.module.css';
import {
    trainerBatchSize,
    trainerCheckpointing,
    trainerLearningRate,
    trainerOutputText,
} from '../../state/trainerSettings';

export default function TrainingSettings() {
    const { t } = useTranslation();
    const [batchSize, setBatchSize] = useAtom(trainerBatchSize);
    const [learningRate, setLearningRate] = useAtom(trainerLearningRate);
    const [outputText, setOutputText] = useAtom(trainerOutputText);
    const [checkpointing, setCheckpointing] = useAtom(trainerCheckpointing);

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
                    min={1}
                    max={64}
                    step={8}
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
        </div>
    );
}
