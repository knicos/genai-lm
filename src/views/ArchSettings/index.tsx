import { FormControl, Slider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAtom } from 'jotai';
import style from './style.module.css';
import { modelConfigAtom, modelSizeLimit } from '../../state/model';
import { Help } from '@genai-fi/base';

export function Component() {
    const { t } = useTranslation();

    const [settings, setSettings] = useAtom(modelConfigAtom);
    const [sizeLimit, setSizeLimit] = useAtom(modelSizeLimit);
    const { blockSize, mlpFactor } = settings;

    return (
        <div className="sidePanel">
            <h2>{t('app.settings.arch')}</h2>

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
                    max={1024}
                    step={32}
                    valueLabelDisplay="auto"
                />
            </FormControl>
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
                    max={8}
                    step={1}
                    valueLabelDisplay="auto"
                />
            </FormControl>
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
                    max={100}
                    step={1}
                    valueLabelDisplay="auto"
                />
            </FormControl>
        </div>
    );
}
