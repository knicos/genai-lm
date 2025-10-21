import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export const deviceDetected = atom<boolean>(false);
export const deviceHasWebGPU = atom<boolean>(false);
export const deviceHasWebGL = atom<boolean>(false);

export const devicePerformProbe = atomWithStorage<boolean>('devicePerformProbe', false);
