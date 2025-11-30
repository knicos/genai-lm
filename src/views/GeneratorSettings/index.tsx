import { Checkbox, FormControl, FormControlLabel, Slider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAtom } from 'jotai';
import style from './style.module.css';
import { generatorSettings } from '../../state/generator';

export function Component() {
    const { t } = useTranslation();

    const [settings, setSettings] = useAtom(generatorSettings);
    const { temperature, topP, maxLength, showProbabilities: probability, showSettings } = settings;

    return (
        <div className="sidePanel">
            <h2>{t('app.settings.generator')}</h2>
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
                    onChange={(_, value) => setSettings({ ...settings, temperature: value as number })}
                    min={0.5}
                    max={1.5}
                    step={0.1}
                    valueLabelDisplay="auto"
                />
            </FormControl>
            <FormControl sx={{ marginTop: '1rem' }}>
                <div
                    id="topp-label"
                    className={style.label}
                >
                    {t('app.settings.topP')}
                </div>
                <Slider
                    aria-labelledby="topp-label"
                    value={topP}
                    onChange={(_, value) => setSettings({ ...settings, topP: value as number })}
                    min={0}
                    max={1}
                    step={0.01}
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
                    onChange={(_, value) => setSettings({ ...settings, maxLength: value as number })}
                    min={10}
                    max={64000}
                    step={1000}
                    valueLabelDisplay="auto"
                />
            </FormControl>
            <div className={style.spacer} />
            <FormControl sx={{ marginTop: '1rem' }}>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={probability}
                            onChange={(_, checked) => setSettings({ ...settings, showProbabilities: checked })}
                        />
                    }
                    label={t('app.settings.showProbabilities')}
                />
            </FormControl>
            <FormControl sx={{ marginTop: '1rem' }}>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={showSettings}
                            onChange={(_, checked) => setSettings({ ...settings, showSettings: checked })}
                        />
                    }
                    label={t('app.settings.showSettings')}
                />
            </FormControl>
        </div>
    );
}
