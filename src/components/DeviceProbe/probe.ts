async function hasWebGPU(): Promise<boolean> {
    try {
        if (!navigator.gpu) {
            return false;
        }

        const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
        return adapter !== null;
    } catch {
        return false;
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

export async function getDeviceInfo(): Promise<{ hasWebGPU: boolean; hasWebGL2: boolean; hasWebGL1: boolean }> {
    const [gpu, gl2, gl1] = await Promise.all([hasWebGPU(), hasWebGL2(), hasWebGL1()]);
    return { hasWebGPU: gpu, hasWebGL2: gl2, hasWebGL1: gl1 };
}
