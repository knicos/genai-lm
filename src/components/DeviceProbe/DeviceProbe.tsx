import { Spinner } from '@genai-fi/base';
import style from './style.module.css';
import { trainerSettings } from '../../state/trainer';
import { useEffect, useState } from 'react';
import {
    deviceHasWebGPU,
    deviceHasWebGL,
    deviceDetected,
    deviceCapabilities,
    deviceLowPower,
    deviceDisableSubgroups,
    lowEndDevice,
} from '../../state/device';
import { useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { TeachableLLM } from '@genai-fi/nanogpt';
import { getDeviceInfo } from './probe';
import logger from '../../utilities/logger';

export default function DeviceProbe() {
    const { t } = useTranslation();
    const setHasWebGPU = useSetAtom(deviceHasWebGPU);
    const setHasWebGL = useSetAtom(deviceHasWebGL);
    const setDetected = useSetAtom(deviceDetected);
    const setCapabilities = useSetAtom(deviceCapabilities);
    const setTrainerSettings = useSetAtom(trainerSettings);
    const lowPowerMode = useAtomValue(deviceLowPower);
    const setLowEndDevice = useSetAtom(lowEndDevice);
    const subgroupsDisabled = useAtomValue(deviceDisableSubgroups);
    const [done, setDone] = useState(false);

    useEffect(() => {
        getDeviceInfo(lowPowerMode).then(
            async ({ hasWebGPU, hasWebGL1, hasWebGL2, lowEndDevice: isLowEnd, deviceCapabilities: devCap }) => {
                if (hasWebGPU) {
                    await TeachableLLM.selectBackend('webgpu', {
                        powerPreference: lowPowerMode ? 'low-power' : 'high-performance',
                        disableSubgroups: subgroupsDisabled,
                    });
                }
                setHasWebGPU(hasWebGPU);
                setHasWebGL(hasWebGL2 || hasWebGL1);
                setDetected(true);
                setCapabilities(devCap);
                setLowEndDevice(isLowEnd);

                if (isLowEnd) {
                    setTrainerSettings((prev) => ({
                        ...prev,
                        batchSize: Math.min(prev.batchSize, 4),
                        disableCheckpointing: false,
                    }));
                }

                logger.log({
                    action: 'device_probed',
                    hasWebGPU,
                    hasWebGL1,
                    hasWebGL2,
                    deviceCapabilities: devCap,
                });
                setDone(true);
            }
        );
    }, [
        setHasWebGL,
        setHasWebGPU,
        setDetected,
        setCapabilities,
        setLowEndDevice,
        setTrainerSettings,
        lowPowerMode,
        subgroupsDisabled,
    ]);

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
