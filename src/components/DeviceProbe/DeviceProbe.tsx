import { Spinner } from '@genai-fi/base';
import style from './style.module.css';
import { useEffect, useState } from 'react';
import {
    deviceHasWebGPU,
    deviceHasWebGL,
    deviceDetected,
    deviceCapabilities,
    deviceLowPower,
    deviceDisableSubgroups,
} from '../../state/device';
import { useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { selectBackend } from '@genai-fi/nanogpt';
import { getDeviceInfo } from './probe';
import logger from '../../utilities/logger';

export default function DeviceProbe() {
    const { t } = useTranslation();
    const setHasWebGPU = useSetAtom(deviceHasWebGPU);
    const setHasWebGL = useSetAtom(deviceHasWebGL);
    const setDetected = useSetAtom(deviceDetected);
    const setCapabilities = useSetAtom(deviceCapabilities);
    const lowPowerMode = useAtomValue(deviceLowPower);
    const subgroupsDisabled = useAtomValue(deviceDisableSubgroups);
    const [done, setDone] = useState(false);

    useEffect(() => {
        getDeviceInfo(lowPowerMode).then(async ({ hasWebGPU, hasWebGL1, hasWebGL2, deviceCapabilities: devCap }) => {
            if (hasWebGPU) {
                await selectBackend('webgpu', {
                    powerPreference: lowPowerMode ? 'low-power' : 'high-performance',
                    disableSubgroups: subgroupsDisabled,
                });
            }
            setHasWebGPU(hasWebGPU);
            setHasWebGL(hasWebGL2 || hasWebGL1);
            setDetected(true);
            setCapabilities(devCap);
            logger.log({
                action: 'device_probed',
                hasWebGPU,
                hasWebGL1,
                hasWebGL2,
                deviceCapabilities: devCap,
            });
            setDone(true);
        });
    }, [setHasWebGL, setHasWebGPU, setDetected, setCapabilities, lowPowerMode]);

    if (done) {
        return null;
    }

    return (
        <div className={style.container}>
            <Spinner />
            <div>{t('deviceProbe.probing')}</div>
        </div>
    );
}
