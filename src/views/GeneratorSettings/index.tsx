import { FormControl, Slider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAtom, useAtomValue } from 'jotai';
import style from './style.module.css';
import { generatorSettings } from '../../state/generator';
import { uiDeveloperMode } from '../../state/uiState';
import Help from '../../components/Help/Help';

export function Component() {
    const { t } = useTranslation();
    const devMode = useAtomValue(uiDeveloperMode);
    const [settings, setSettings] = useAtom(generatorSettings);
    const { temperature, topP, maxLength } = settings;

    return (
        <div className="sidePanel">
            <h2>{t('app.settings.generator')}</h2>
            <FormControl sx={{ marginTop: '1rem' }}>
                <div
                    id="temperature-label"
                    className={style.label}
                >
                    <Help
                        message={t('app.settings.temperatureHelp')}
                        inplace
                    >
                        {t('app.settings.temperature')}
                    </Help>
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
            {devMode && (
                <>
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
                </>
            )}
        </div>
    );
}
