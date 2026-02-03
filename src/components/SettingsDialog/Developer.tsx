import { useAtom, useAtomValue } from 'jotai';
import style from './style.module.css';
import { useTranslation } from 'react-i18next';
import { Checkbox, FormControlLabel } from '@mui/material';
import {
    deviceHasWebGPU,
    deviceHasWebGL,
    devicePerformProbe,
    deviceCapabilities,
    deviceLowPower,
    deviceDisableSubgroups,
} from '../../state/device';
import { uiDeveloperMode } from '../../state/uiState';

export default function DeveloperSettings() {
    const { t } = useTranslation();
    const [performProbe, setPerformProbe] = useAtom(devicePerformProbe);
    const [developerMode, setDeveloperMode] = useAtom(uiDeveloperMode);
    const [lowPowerMode, setLowPowerMode] = useAtom(deviceLowPower);
    const [disableSubgroups, setDisableSubgroups] = useAtom(deviceDisableSubgroups);
    const hasWebGPU = useAtomValue(deviceHasWebGPU);
    const hasWebGL = useAtomValue(deviceHasWebGL);
    const capabilities = useAtomValue(deviceCapabilities);

    return (
        <div className={style.columns}>
            <div className={style.column}>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={developerMode}
                            onChange={(_, checked) => setDeveloperMode(checked)}
                        />
                    }
                    label={t('app.settings.developerMode')}
                />
                <div className={style.spacer} />
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={performProbe}
                            onChange={(_, checked) => setPerformProbe(checked)}
                        />
                    }
                    label={t('app.settings.performProbe')}
                />
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={lowPowerMode}
                            onChange={(_, checked) => setLowPowerMode(checked)}
                        />
                    }
                    label={t('app.settings.lowPowerMode')}
                />
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={disableSubgroups}
                            onChange={(_, checked) => setDisableSubgroups(checked)}
                        />
                    }
                    label={t('app.settings.disableSubgroups')}
                />
                <div>
                    <div>WebGL: {hasWebGL ? 'Available' : 'Not Available'}</div>
                    <div>WebGPU: {hasWebGPU ? 'Available' : 'Not Available'}</div>
                    <div>Has Subgroups: {capabilities?.subgroups ? 'Yes' : 'No'}</div>
                    <div>Subgroup Size: {capabilities?.subgroupSize ?? 'N/A'}</div>
                    <div>Float16 Support: {capabilities?.float16 ? 'Yes' : 'No'}</div>
                    <div>Vendor: {capabilities?.vendor ?? 'N/A'}</div>
                </div>
            </div>
        </div>
    );
}
