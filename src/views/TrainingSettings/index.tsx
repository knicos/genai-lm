import { Checkbox, FormControl, FormControlLabel, Slider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAtom, useAtomValue } from 'jotai';
import style from './style.module.css';
import { trainerSettings } from '../../state/trainer';
import { uiDeveloperMode } from '../../state/uiState';
import { Help } from '@genai-fi/base';

export function Component() {
    const { t } = useTranslation();
    const [settings, setSettings] = useAtom(trainerSettings);
    const devMode = useAtomValue(uiDeveloperMode);

    return (
        <div className="sidePanel">
            <h2>{t('app.settings.training')}</h2>
            <FormControl className={style.sliderControl}>
                <div
                    id="epochs-label"
                    className={style.label}
                >
                    <Help
                        message={t('app.settings.epochsHelp')}
                        inplace
                        dark
                    >
                        {t('app.settings.epochs')}
                    </Help>
                </div>
                <Slider
                    aria-labelledby="epochs-label"
                    value={settings.maxEpochs}
                    onChange={(_, value) => setSettings({ ...settings, maxEpochs: value as number })}
                    min={1}
                    max={10}
                    step={1}
                    valueLabelDisplay="auto"
                />
            </FormControl>
            <FormControl className={style.sliderControl}>
                <div
                    id="batch-label"
                    className={style.label}
                >
                    <Help
                        message={t('app.settings.batchHelp')}
                        inplace
                        dark
                    >
                        {t('app.settings.batchSize')}
                    </Help>
                </div>
                <Slider
                    aria-labelledby="batch-label"
                    value={settings.batchSize}
                    onChange={(_, value) => setSettings({ ...settings, batchSize: value as number })}
                    min={2}
                    max={64}
                    step={null}
                    marks={[
                        { value: 1, label: '1' },
                        { value: 2, label: '2' },
                        { value: 4, label: '4' },
                        { value: 8, label: '8' },
                        { value: 16, label: '16' },
                        { value: 32, label: '32' },
                        { value: 64, label: '64' },
                    ]}
                    valueLabelDisplay="auto"
                />
            </FormControl>
            <FormControl className={style.sliderControl}>
                <div
                    id="learningRate-label"
                    className={style.label}
                >
                    <Help
                        message={t('app.settings.lrHelp')}
                        inplace
                        dark
                    >
                        {t('app.settings.learningRate')}
                    </Help>
                </div>
                <Slider
                    aria-labelledby="learningRate-label"
                    value={settings.learningRate}
                    onChange={(_, value) =>
                        setSettings({
                            ...settings,
                            learningRate: value as number,
                            minLearningRate: settings.minLearningRate
                                ? Math.min(settings.minLearningRate, (value as number) * 0.1)
                                : undefined,
                        })
                    }
                    min={0.00001}
                    max={0.001}
                    step={0.00001}
                    valueLabelDisplay="auto"
                    marks={[
                        { value: 0.00001, label: '1e-5' },
                        { value: 0.0002, label: '2e-4' },
                        { value: 0.001, label: '1e-3' },
                    ]}
                />
            </FormControl>
            {devMode && (
                <>
                    <div className={style.spacer} />
                    <h3>{t('app.settings.developerOptions')}</h3>
                    <FormControl
                        className={style.sliderControl}
                        sx={{ marginBottom: '2rem' }}
                    >
                        <div
                            id="minLearningRate-label"
                            className={style.label}
                        >
                            {t('app.settings.minLearningRate')}
                        </div>
                        <Slider
                            aria-labelledby="minLearningRate-label"
                            value={settings.minLearningRate}
                            onChange={(_, value) =>
                                setSettings({
                                    ...settings,
                                    learningRate: settings.learningRate
                                        ? Math.max(settings.learningRate, (value as number) * 10)
                                        : undefined,
                                    minLearningRate: value as number,
                                })
                            }
                            min={0.000001}
                            max={0.0001}
                            step={0.000001}
                            valueLabelDisplay="auto"
                            marks={[
                                { value: 0.000001, label: '1e-6' },
                                { value: 0.00002, label: '2e-5' },
                                { value: 0.0001, label: '1e-4' },
                            ]}
                        />
                    </FormControl>
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
                                    checked={settings.maskedLoss}
                                    onChange={(_, checked) => setSettings({ ...settings, maskedLoss: checked })}
                                />
                            }
                            label={t('app.settings.maskedLoss')}
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
                            max={0.1}
                            step={0.01}
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
