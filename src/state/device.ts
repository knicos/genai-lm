import { atomWithStorage } from 'jotai/utils';

export const deviceMemory = atomWithStorage<number | null>('deviceMemory', null);
export const deviceHasWebGPU = atomWithStorage<boolean>('deviceHasWebGPU', false);
export const deviceName = atomWithStorage<string | null>('deviceName', null);
export const deviceDedicated = atomWithStorage<boolean | null>('deviceDedicated', null);
