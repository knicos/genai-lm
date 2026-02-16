import {
    Checkbox,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    Slider,
    TextField,
} from '@mui/material';
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
                    max={8}
                    step={1}
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
                            {t('app.settings.decaySteps')}
                        </div>
                        <Slider
                            aria-labelledby="decay-label"
                            value={settings.decaySteps}
                            onChange={(_, value) => setSettings({ ...settings, decaySteps: value as number })}
                            min={1000}
                            max={100000}
                            step={100}
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
                    <div className={style.spacer} />
                    <FormControl style={{ marginTop: '2rem' }}>
                        <InputLabel id="sftMode-label">{t('app.settings.sftMode')}</InputLabel>
                        <Select
                            labelId="sftMode-label"
                            value={settings.sftMode}
                            onChange={(e) =>
                                setSettings({ ...settings, sftMode: e.target.value as 'last-layer' | 'full' | 'lora' })
                            }
                            label={t('app.settings.sftMode')}
                        >
                            <MenuItem value="last-layer">{t('app.settings.sftModeLastLayer')}</MenuItem>
                            <MenuItem value="full">{t('app.settings.sftModeFull')}</MenuItem>
                            <MenuItem value="lora">{t('app.settings.sftModeLora')}</MenuItem>
                        </Select>
                    </FormControl>
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
                                            ...(settings.loraConfig ?? { alpha: 8, variables: ['*'] }),
                                            rank: value as number,
                                        },
                                    })
                                }
                                min={2}
                                max={16}
                                step={2}
                                valueLabelDisplay="auto"
                                disabled={settings.loraConfig === undefined}
                            />
                        </FormControl>
                        <TextField
                            multiline
                            minRows={2}
                            label={t('app.settings.loraVariables')}
                            value={settings.loraConfig?.variables.join('\n') ?? ''}
                            onChange={(e) => {
                                const variables = e.target.value.split('\n').map((v) => v.trim());
                                setSettings({
                                    ...settings,
                                    loraConfig: {
                                        ...(settings.loraConfig ?? { rank: 4, alpha: 8 }),
                                        variables,
                                    },
                                });
                            }}
                            disabled={settings.loraConfig === undefined}
                        />
                    </fieldset>
                </>
            )}
        </div>
    );
}
