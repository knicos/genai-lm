import { Spinner } from '@genai-fi/base';
import GPUMemoryWorker from './worker.ts?worker';
import style from './style.module.css';

// Create worker instance
const worker = new GPUMemoryWorker();

import { EventEmitter } from 'eventemitter3';
import { useEffect } from 'react';
import { deviceDedicated, deviceHasWebGPU, deviceMemory, deviceName } from '../../state/device';
import { useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

const ee = new EventEmitter<'start' | 'progress' | 'complete' | 'error'>();

worker.onmessage = (e) => {
    switch (e.data.type) {
        case 'start':
            ee.emit('start', e.data.chunkSize);
            break;
        case 'progress':
            ee.emit('progress', e.data.allocated);
            break;
        case 'complete':
            ee.emit('complete', e.data.maxMemory);
            break;
        case 'error':
            ee.emit('error', e.data.message);
            break;
    }
};

async function getDeviceInfo(): Promise<{ name: string; dedicated: boolean; hasWebGPU: boolean }> {
    try {
        if (!navigator.gpu) {
            return { name: 'Unknown', dedicated: false, hasWebGPU: false };
        }

        const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
        if (adapter) {
            const info = adapter.info;
            const name = info?.vendor || 'unknown';
            return { name, dedicated: name === 'nvidia', hasWebGPU: true };
        }
        return { name: 'Unknown', dedicated: false, hasWebGPU: false };
    } catch {
        return { name: 'Unknown', dedicated: false, hasWebGPU: false };
    }
}

export default function DeviceProbe() {
    const { t } = useTranslation();
    const setMemory = useSetAtom(deviceMemory);
    const setHasWebGPU = useSetAtom(deviceHasWebGPU);
    const setName = useSetAtom(deviceName);
    const setDedicated = useSetAtom(deviceDedicated);

    useEffect(() => {
        getDeviceInfo().then(({ name, dedicated, hasWebGPU }) => {
            setName(name);
            setDedicated(dedicated);
            setHasWebGPU(hasWebGPU);
        });

        if (localStorage.getItem('deviceMemory')) {
            worker.terminate();
            return;
        }

        const handleStart = (chunkSize: number) => {
            console.log(`Starting probe with ${chunkSize} byte chunks`);
        };
        const handleComplete = (maxMemory: number) => {
            console.log(`Max GPU memory: ${(maxMemory / (1024 * 1024 * 1024)).toFixed(2)} GB`);
            worker.terminate();
            setMemory(maxMemory);
            if (maxMemory === 0) {
                setHasWebGPU(false);
            }
        };
        const handleError = (message: string) => {
            console.error('Error:', message);
        };

        ee.on('start', handleStart);
        ee.on('complete', handleComplete);
        ee.on('error', handleError);

        worker.postMessage({ type: 'probe' });

        return () => {
            ee.off('start', handleStart);
            ee.off('complete', handleComplete);
            ee.off('error', handleError);
        };
    }, [setMemory, setName, setDedicated, setHasWebGPU]);

    return (
        <div className={style.container}>
            <Spinner />
            <div>{t('deviceProbe.probing')}</div>
        </div>
    );
}
