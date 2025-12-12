import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { storage } from './storage';

export const deviceDetected = atom<boolean>(false);
export const deviceHasWebGPU = atom<boolean>(false);
export const deviceHasWebGL = atom<boolean>(false);

export interface DeviceCapabilities {
    backend: 'webgpu' | 'webgl' | 'cpu' | 'unknown';
    subgroups: boolean;
    subgroupSize: number;
    float16: boolean;
}

export const deviceCapabilities = atom<DeviceCapabilities | null>(null);

export const devicePerformProbe = atomWithStorage<boolean>('devicePerformProbe', true, storage, {
    getOnInit: true,
});
