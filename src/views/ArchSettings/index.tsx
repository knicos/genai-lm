import { FormControl, Slider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAtom } from 'jotai';
import style from './style.module.css';
import { modelConfigAtom } from '../../state/model';

export function Component() {
    const { t } = useTranslation();

    const [settings, setSettings] = useAtom(modelConfigAtom);
    const { blockSize, mlpFactor } = settings;

    return (
        <div className="sidePanel">
            <h2>{t('app.settings.arch')}</h2>
            <FormControl sx={{ marginTop: '1rem' }}>
                <div
                    id="blockSize-label"
                    className={style.label}
                >
                    {t('app.settings.blockSize')}
                </div>
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
            <FormControl sx={{ marginTop: '1rem' }}>
                <div
                    id="mlpFactor-label"
                    className={style.label}
                >
                    {t('app.settings.mlpFactor')}
                </div>
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
        </div>
    );
}
