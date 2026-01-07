import { DeviceCapabilities } from '../../state/device';

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

        if (hasSubgroups) {
            subgroupSize = adapter.info.subgroupMaxSize ?? 0;
        }

        return {
            backend: 'webgpu',
            subgroups: hasSubgroups,
            subgroupSize: subgroupSize,
            float16: hasFloat16,
            vendor: adapter.info.vendor || 'unknown',
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

export async function getDeviceInfo(lowPower?: boolean): Promise<{
    hasWebGPU: boolean;
    hasWebGL2: boolean;
    hasWebGL1: boolean;
    deviceCapabilities: DeviceCapabilities;
}> {
    const [gpu, gl2, gl1] = await Promise.all([hasWebGPU(lowPower), hasWebGL2(), hasWebGL1()]);
    return {
        hasWebGPU: !!gpu,
        hasWebGL2: gl2,
        hasWebGL1: gl1,
        deviceCapabilities: gpu ?? {
            backend: gl2 ? 'webgl' : gl1 ? 'webgl' : 'cpu',
            subgroups: false,
            subgroupSize: 0,
            float16: gl2,
            vendor: 'unknown',
        },
    };
}
