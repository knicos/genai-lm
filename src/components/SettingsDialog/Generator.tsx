import { Checkbox, FormControl, FormControlLabel, Slider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAtom } from 'jotai';
import style from './style.module.css';
import {
    generatorMaxLength,
    generatorShowProbabilities,
    generatorShowPrompt,
    generatorShowSettings,
    generatorTemperature,
} from '../../state/generatorSettings';

export default function GeneratorSettings() {
    const { t } = useTranslation();
    const [temperature, setTemperature] = useAtom(generatorTemperature);
    const [maxLength, setMaxLength] = useAtom(generatorMaxLength);
    const [probability, setProbability] = useAtom(generatorShowProbabilities);
    const [prompt, setPrompt] = useAtom(generatorShowPrompt);
    const [showSettings, setShowSettings] = useAtom(generatorShowSettings);

    return (
        <div className={style.column}>
            <FormControl sx={{ marginTop: '1rem' }}>
                <div
                    id="temperature-label"
                    className={style.label}
                >
                    {t('app.settings.temperature')}
                </div>
                <Slider
                    aria-labelledby="temperature-label"
                    value={temperature}
                    onChange={(_, value) => setTemperature(value as number)}
                    min={0.5}
                    max={1.5}
                    step={0.1}
                    valueLabelDisplay="auto"
                />
            </FormControl>
            <FormControl sx={{ marginTop: '1rem' }}>
                <div
                    id="maxlength-label"
                    className={style.label}
                >
                    {t('app.settings.maxLength')}
                </div>
                <Slider
                    aria-labelledby="maxlength-label"
                    value={maxLength}
                    onChange={(_, value) => setMaxLength(value as number)}
                    min={10}
                    max={1024}
                    step={10}
                    valueLabelDisplay="auto"
                />
            </FormControl>
            <div className={style.spacer} />
            <FormControl sx={{ marginTop: '1rem' }}>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={probability}
                            onChange={(_, checked) => setProbability(checked)}
                        />
                    }
                    label={t('app.settings.showProbabilities')}
                />
            </FormControl>
            <FormControl sx={{ marginTop: '1rem' }}>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={prompt}
                            onChange={(_, checked) => setPrompt(checked)}
                        />
                    }
                    label={t('app.settings.showPrompt')}
                />
            </FormControl>
            <FormControl sx={{ marginTop: '1rem' }}>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={showSettings}
                            onChange={(_, checked) => setShowSettings(checked)}
                        />
                    }
                    label={t('app.settings.showSettings')}
                />
            </FormControl>
        </div>
    );
}
