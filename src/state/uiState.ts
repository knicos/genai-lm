import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export const uiShowSettings = atom(false);
export const uiShowVisualisation = atom(false);
export const uiShowSidePanel = atom(false);
export const uiDeveloperMode = atomWithStorage('uiDeveloperMode', false);
