import { Checkbox, FormControl, FormControlLabel, Slider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAtom, useAtomValue } from 'jotai';
import style from './style.module.css';
import { trainerSettings } from '../../state/trainer';
import { uiDeveloperMode } from '../../state/uiState';

export function Component() {
    const { t } = useTranslation();
    const [settings, setSettings] = useAtom(trainerSettings);
    const devMode = useAtomValue(uiDeveloperMode);

    return (
        <div className="sidePanel">
            <h2>{t('app.settings.training')}</h2>
            <FormControl sx={{ marginTop: '1rem' }}>
                <div
                    id="batch-label"
                    className={style.label}
                >
                    {t('app.settings.batchSize')}
                </div>
                <Slider
                    aria-labelledby="batch-label"
                    value={settings.batchSize}
                    onChange={(_, value) => setSettings({ ...settings, batchSize: value as number })}
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
                    value={settings.learningRate}
                    onChange={(_, value) => setSettings({ ...settings, learningRate: value as number })}
                    min={0.0001}
                    max={0.01}
                    step={0.0001}
                    valueLabelDisplay="auto"
                />
            </FormControl>
            {devMode && (
                <>
                    <div className={style.spacer} />
                    <FormControl>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={settings.disableCheckpointing}
                                    onChange={(_, checked) =>
                                        setSettings({ ...settings, disableCheckpointing: checked })
                                    }
                                />
                            }
                            label={t('app.settings.checkpointing')}
                        />
                    </FormControl>
                    <FormControl>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={settings.mixedPrecision}
                                    onChange={(_, checked) => setSettings({ ...settings, mixedPrecision: checked })}
                                />
                            }
                            label={t('app.settings.mixedPrecision')}
                        />
                    </FormControl>
                </>
            )}
        </div>
    );
}
