import { DeviceCapabilities } from '../../state/device';
import { estimateFullTrainingPowerWatts } from './power';

async function hasWebGPU(lowPower?: boolean): Promise<DeviceCapabilities | null> {
    try {
        if (!navigator.gpu) {
            return null;
        }

        const adapter = await navigator.gpu.requestAdapter({
            powerPreference: lowPower ? 'low-power' : 'high-performance',
        });
        if (!adapter) {
            return null;
        }

        const features = adapter.features;
        const hasFloat16 = features.has('shader-f16');
        const hasSubgroups = features.has('subgroups');
        let subgroupSize = 0;

        const power = await estimateFullTrainingPowerWatts(adapter);

        if (hasSubgroups) {
            subgroupSize = adapter.info.subgroupMaxSize ?? 0;
        }

        return {
            backend: 'webgpu',
            subgroups: hasSubgroups,
            subgroupSize: subgroupSize,
            float16: hasFloat16,
            vendor: adapter.info.vendor || 'unknown',
            powerUse: power,
        };
    } catch {
        return null;
    }
}

async function hasWebGL2(): Promise<boolean> {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2');
        return gl !== null;
    } catch {
        return false;
    }
}

async function hasWebGL1(): Promise<boolean> {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');
        return gl !== null;
    } catch {
        return false;
    }
}

interface UserAgentData {
    brands: { brand: string; version: string }[];
    mobile: boolean;
    platform: string;
}

export async function getDeviceInfo(lowPower?: boolean): Promise<{
    hasWebGPU: boolean;
    hasWebGL2: boolean;
    hasWebGL1: boolean;
    lowEndDevice: boolean;
    deviceCapabilities: DeviceCapabilities;
}> {
    let lowEndDevice = false;

    if ('userAgentData' in navigator) {
        const data = navigator.userAgentData as UserAgentData;
        /*if (data.platform === 'Chrome OS') {
            lowEndDevice = true;
        }*/
        if (data.mobile) {
            lowEndDevice = true;
        }
    }
    if ('hardwareConcurrency' in navigator) {
        if (navigator.hardwareConcurrency <= 4) {
            lowEndDevice = true;
        }
    }
    if ('deviceMemory' in navigator) {
        if ((navigator.deviceMemory as number) <= 4) {
            lowEndDevice = true;
        }
    }
    if (window.sessionStorage.getItem('fatalError') === 'true') {
        lowEndDevice = true;
    }

    const [gpu, gl2, gl1] = await Promise.all([hasWebGPU(lowPower), hasWebGL2(), hasWebGL1()]);

    return {
        hasWebGPU: !!gpu,
        hasWebGL2: gl2,
        hasWebGL1: gl1,
        lowEndDevice,

        deviceCapabilities: gpu ?? {
            backend: gl2 ? 'webgl' : gl1 ? 'webgl' : 'cpu',
            subgroups: false,
            subgroupSize: 0,
            float16: gl2,
            vendor: 'unknown',
            powerUse: await estimateFullTrainingPowerWatts(),
        },
    };
}
