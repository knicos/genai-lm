import { FormControl, InputLabel, Slider, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAtom, useAtomValue } from 'jotai';
import style from './style.module.css';
import { modelConfigAtom, modelSizeLimit } from '../../state/model';
import type { ExtendedConfig } from '../../state/model';
import { lowEndDevice } from '../../state/device';
import { Help } from '@genai-fi/base';
import { changeModelType } from './changeModelType';

export function Component() {
    const { t } = useTranslation();

    const [settings, setSettings] = useAtom(modelConfigAtom);
    const [sizeLimit, setSizeLimit] = useAtom(modelSizeLimit);
    const lowEnd = useAtomValue(lowEndDevice);
    const { blockSize, mlpFactor } = settings;

    const hasMLPFactor = settings.modelType === 'GenAI_NanoGPT_v2' || settings.modelType === 'loop_nano';

    return (
        <div className="sidePanel">
            <h2>{t('app.settings.arch')}</h2>

            <div className={style.sliderControl}>
                <FormControl fullWidth>
                    <InputLabel id="model-arch-label">{t('model.archType.label')}</InputLabel>
                    <Select
                        labelId="model-arch-label"
                        label={t('model.archType.label')}
                        defaultValue="GenAI_NanoGPT_v2"
                        value={settings.modelType}
                        onChange={(e: SelectChangeEvent<ExtendedConfig['modelType']>) => {
                            const modelType = e.target.value;
                            setSettings((current) => changeModelType(current, modelType));
                        }}
                    >
                        <MenuItem value="GenAI_NanoGPT_v2">GenAI Nano</MenuItem>
                        <MenuItem value="qwen3">Qwen3</MenuItem>
                        <MenuItem value="llama">LLaMA</MenuItem>
                        <MenuItem value="loop_nano">Loop</MenuItem>
                    </Select>
                </FormControl>
            </div>
            <FormControl className={style.sliderControl}>
                <Help
                    message={t('app.settings.contextHelp')}
                    inplace
                    dark
                >
                    <div
                        id="blockSize-label"
                        className={style.label}
                    >
                        {t('app.settings.blockSize')}
                    </div>
                </Help>
                <Slider
                    aria-labelledby="blockSize-label"
                    value={blockSize}
                    onChange={(_, value) => setSettings({ ...settings, blockSize: value as number })}
                    min={32}
                    max={lowEnd ? 128 : 1024}
                    step={32}
                    valueLabelDisplay="auto"
                />
            </FormControl>
            {hasMLPFactor && (
                <FormControl className={style.sliderControl}>
                    <Help
                        message={t('app.settings.mlpFactorHelp')}
                        inplace
                        dark
                    >
                        <div
                            id="mlpFactor-label"
                            className={style.label}
                        >
                            {t('app.settings.mlpFactor')}
                        </div>
                    </Help>
                    <Slider
                        aria-labelledby="mlpFactor-label"
                        value={mlpFactor}
                        onChange={(_, value) => setSettings({ ...settings, mlpFactor: value as number })}
                        min={1}
                        max={lowEnd ? 4 : 8}
                        step={0.1}
                        valueLabelDisplay="auto"
                    />
                </FormControl>
            )}
            {settings.modelType === 'loop_nano' && (
                <FormControl className={style.sliderControl}>
                    <Help
                        message={t('app.settings.loopsHelp')}
                        inplace
                        dark
                    >
                        <div
                            id="loops-label"
                            className={style.label}
                        >
                            {t('app.settings.loops')}
                        </div>
                    </Help>
                    <Slider
                        aria-labelledby="loops-label"
                        value={settings.loopSize ?? 2}
                        onChange={(_, value) => setSettings({ ...settings, loopSize: value as number })}
                        min={1}
                        max={8}
                        step={1}
                        valueLabelDisplay="auto"
                    />
                </FormControl>
            )}
            <FormControl className={style.sliderControl}>
                <Help
                    message={t('app.settings.headsHelp')}
                    inplace
                    dark
                >
                    <div
                        id="heads-label"
                        className={style.label}
                    >
                        {t('app.settings.heads')}
                    </div>
                </Help>
                <Slider
                    aria-labelledby="heads-label"
                    value={settings.nHead}
                    onChange={(_, value) => setSettings({ ...settings, nHead: value as number })}
                    min={1}
                    max={32}
                    step={1}
                    valueLabelDisplay="auto"
                />
            </FormControl>
            <FormControl className={style.sliderControl}>
                <div
                    id="size-label"
                    className={style.label}
                >
                    {t('app.settings.sizeLimit')}
                </div>
                <Slider
                    aria-labelledby="size-label"
                    value={sizeLimit}
                    onChange={(_, value) => setSizeLimit(value as number)}
                    min={1}
                    max={lowEnd ? 4 : 100}
                    step={1}
                    valueLabelDisplay="auto"
                />
            </FormControl>
        </div>
    );
}
