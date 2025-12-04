import { Spinner } from '@genai-fi/base';
import style from './style.module.css';
import { useEffect, useState } from 'react';
import { deviceHasWebGPU, deviceHasWebGL, deviceDetected, deviceCapabilities } from '../../state/device';
import { useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { selectBackend } from '@genai-fi/nanogpt';
import { getDeviceInfo } from './probe';

export default function DeviceProbe() {
    const { t } = useTranslation();
    const setHasWebGPU = useSetAtom(deviceHasWebGPU);
    const setHasWebGL = useSetAtom(deviceHasWebGL);
    const setDetected = useSetAtom(deviceDetected);
    const setCapabilities = useSetAtom(deviceCapabilities);
    const [done, setDone] = useState(false);

    useEffect(() => {
        getDeviceInfo().then(async ({ hasWebGPU, hasWebGL1, hasWebGL2, deviceCapabilities: devCap }) => {
            if (hasWebGPU) {
                await selectBackend('webgpu');
            }
            setHasWebGPU(hasWebGPU);
            setHasWebGL(hasWebGL2 || hasWebGL1);
            setDetected(true);
            setCapabilities(devCap);
            setDone(true);
        });
    }, [setHasWebGL, setHasWebGPU, setDetected, setCapabilities]);

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
