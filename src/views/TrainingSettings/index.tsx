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
            <FormControl className={style.sliderControl}>
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
                    min={2}
                    max={64}
                    step={2}
                    valueLabelDisplay="auto"
                />
            </FormControl>
            <FormControl className={style.sliderControl}>
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
                    min={0.00001}
                    max={0.001}
                    step={0.00001}
                    valueLabelDisplay="auto"
                />
            </FormControl>
            {devMode && (
                <>
                    <div className={style.spacer} />
                    <h3>{t('app.settings.developerOptions')}</h3>
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
                    <FormControl className={style.sliderControl}>
                        <div
                            id="layer-drop-label"
                            className={style.label}
                        >
                            {t('app.settings.layerDrop')}
                        </div>
                        <Slider
                            aria-labelledby="layer-drop-label"
                            value={settings.layerDrop}
                            onChange={(_, value) => setSettings({ ...settings, layerDrop: value as number })}
                            min={0}
                            max={0.5}
                            step={0.1}
                            valueLabelDisplay="auto"
                        />
                    </FormControl>
                    <FormControl className={style.sliderControl}>
                        <div
                            id="drop-label"
                            className={style.label}
                        >
                            {t('app.settings.dropout')}
                        </div>
                        <Slider
                            aria-labelledby="drop-label"
                            value={settings.dropout}
                            onChange={(_, value) => setSettings({ ...settings, dropout: value as number })}
                            min={0}
                            max={0.2}
                            step={0.01}
                            valueLabelDisplay="auto"
                        />
                    </FormControl>
                    <FormControl className={style.sliderControl}>
                        <div
                            id="smoothing-label"
                            className={style.label}
                        >
                            {t('app.settings.labelSmoothing')}
                        </div>
                        <Slider
                            aria-labelledby="smoothing-label"
                            value={settings.labelSmoothing}
                            onChange={(_, value) => setSettings({ ...settings, labelSmoothing: value as number })}
                            min={0}
                            max={0.2}
                            step={0.01}
                            valueLabelDisplay="auto"
                        />
                    </FormControl>
                    <fieldset className={style.optimizerFieldset}>
                        <legend className={style.label}>{t('app.settings.optimizer')}</legend>
                        <FormControl className={style.sliderControl}>
                            <div
                                id="warmup-label"
                                className={style.label}
                            >
                                {t('app.settings.warmupSteps')}
                            </div>
                            <Slider
                                aria-labelledby="warmup-label"
                                value={settings.warmupSteps}
                                onChange={(_, value) => setSettings({ ...settings, warmupSteps: value as number })}
                                min={0}
                                max={1000}
                                step={10}
                                valueLabelDisplay="auto"
                            />
                        </FormControl>
                        <FormControl className={style.sliderControl}>
                            <div
                                id="decay-label"
                                className={style.label}
                            >
                                {t('app.settings.decayEpochs')}
                            </div>
                            <Slider
                                aria-labelledby="decay-label"
                                value={settings.decayEpochs}
                                onChange={(_, value) => setSettings({ ...settings, decayEpochs: value as number })}
                                min={1}
                                max={100}
                                step={1}
                                valueLabelDisplay="auto"
                            />
                        </FormControl>
                        <FormControl className={style.sliderControl}>
                            <div
                                id="weight-decay-label"
                                className={style.label}
                            >
                                {t('app.settings.weightDecay')}
                            </div>
                            <Slider
                                aria-labelledby="weight-decay-label"
                                value={settings.weightDecay}
                                onChange={(_, value) => setSettings({ ...settings, weightDecay: value as number })}
                                min={0}
                                max={0.2}
                                step={0.01}
                                valueLabelDisplay="auto"
                            />
                        </FormControl>
                        <FormControl>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={settings.clipNorm !== undefined}
                                        onChange={(_, checked) =>
                                            setSettings({ ...settings, clipNorm: checked ? 1 : undefined })
                                        }
                                    />
                                }
                                label={t('app.settings.gradClipping')}
                            />
                        </FormControl>
                        <FormControl>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={settings.orthoGrad || false}
                                        onChange={(_, checked) => setSettings({ ...settings, orthoGrad: checked })}
                                    />
                                }
                                label={t('app.settings.orthoGrad')}
                            />
                        </FormControl>
                    </fieldset>
                </>
            )}
        </div>
    );
}
