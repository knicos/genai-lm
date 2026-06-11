import { Checkbox, FormControl, FormControlLabel, Slider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAtom, useAtomValue } from 'jotai';
import style from './style.module.css';
import { tunerSettings } from '../../state/trainer';
import { uiDeveloperMode } from '../../state/uiState';

export function Component() {
    const { t } = useTranslation();
    const [settings, setSettings] = useAtom(tunerSettings);
    const devMode = useAtomValue(uiDeveloperMode);

    return (
        <div className="sidePanel">
            <h2>{t('app.settings.training')}</h2>
            <FormControl sx={{ marginTop: '1rem' }}>
                <div
                    id="epoch-label"
                    className={style.label}
                >
                    {t('app.settings.epochs')}
                </div>
                <Slider
                    aria-labelledby="epoch-label"
                    value={settings.maxEpochs}
                    onChange={(_, value) => setSettings({ ...settings, maxEpochs: value as number })}
                    min={1}
                    max={10}
                    step={1}
                    valueLabelDisplay="auto"
                    marks
                />
            </FormControl>
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
                    min={1}
                    max={32}
                    step={null}
                    marks={[
                        { value: 1, label: '1' },
                        { value: 2, label: '2' },
                        { value: 4, label: '4' },
                        { value: 8, label: '8' },
                        { value: 16, label: '16' },
                        { value: 32, label: '32' },
                    ]}
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
                    min={0.00001}
                    max={0.001}
                    step={0.00001}
                    marks={[
                        { value: 0.00001, label: '1e-5' },
                        { value: 0.0002, label: '2e-4' },
                        { value: 0.001, label: '1e-3' },
                    ]}
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
                                    checked={settings.maskedLoss}
                                    onChange={(_, checked) => setSettings({ ...settings, maskedLoss: checked })}
                                />
                            }
                            label={t('app.settings.maskedLoss')}
                        />
                    </FormControl>
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
                            marks={[
                                { value: 0, label: '0' },
                                { value: 250, label: '250' },
                                { value: 500, label: '500' },
                                { value: 750, label: '750' },
                                { value: 1000, label: '1000' },
                            ]}
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
                            max={10}
                            step={1}
                            valueLabelDisplay="auto"
                            marks
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
                            marks={[
                                { value: 0, label: '0' },
                                { value: 0.05, label: '0.05' },
                                { value: 0.1, label: '0.1' },
                                { value: 0.15, label: '0.15' },
                                { value: 0.2, label: '0.2' },
                            ]}
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
                            marks={[
                                { value: 0, label: '0' },
                                { value: 0.05, label: '0.05' },
                                { value: 0.1, label: '0.1' },
                                { value: 0.15, label: '0.15' },
                                { value: 0.2, label: '0.2' },
                            ]}
                        />
                    </FormControl>
                    <div className={style.spacer} />
                    <fieldset className={style.fieldset}>
                        <legend className={style.label}>{t('app.settings.loraConfig')}</legend>
                        <FormControl>
                            <div id="loraRank-label">{t('app.settings.loraRank')}</div>
                            <Slider
                                aria-labelledby="loraRank-label"
                                value={settings.loraConfig?.rank ?? 4}
                                onChange={(_, value) =>
                                    setSettings({
                                        ...settings,
                                        loraConfig: {
                                            ...(settings.loraConfig ?? { rank: 4, alpha: 8, variables: ['*'] }),
                                            rank: value as number,
                                        },
                                    })
                                }
                                min={2}
                                max={16}
                                step={null}
                                marks={[
                                    { value: 2, label: '2' },
                                    { value: 4, label: '4' },
                                    { value: 8, label: '8' },
                                    { value: 16, label: '16' },
                                ]}
                                valueLabelDisplay="auto"
                                disabled={settings.loraConfig === undefined}
                            />
                        </FormControl>
                        <FormControl>
                            <div id="loraAlpha-label">{t('app.settings.loraAlpha')}</div>
                            <Slider
                                aria-labelledby="loraAlpha-label"
                                value={settings.loraConfig?.alpha ?? 8}
                                onChange={(_, value) =>
                                    setSettings({
                                        ...settings,
                                        loraConfig: {
                                            ...(settings.loraConfig ?? { rank: 4, alpha: 8, variables: ['*'] }),
                                            alpha: value as number,
                                        },
                                    })
                                }
                                min={4}
                                max={64}
                                step={null}
                                marks={[
                                    { value: 4, label: '4' },
                                    { value: 8, label: '8' },
                                    { value: 16, label: '16' },
                                    { value: 32, label: '32' },
                                    { value: 64, label: '64' },
                                ]}
                                valueLabelDisplay="auto"
                                disabled={settings.loraConfig === undefined}
                            />
                        </FormControl>
                    </fieldset>
                </>
            )}
        </div>
    );
}
