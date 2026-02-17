import { randomId } from '@genai-fi/base';
import { atom } from 'jotai';

export const enableSharing = atom<boolean>(false);

export const sessionCode = atom<string>(randomId(8));
