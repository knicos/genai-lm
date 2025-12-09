import { atom } from 'jotai';
import Downloader from '../utilities/downloader';

export const datasetAtom = atom<string[]>([]);

export const downloadsAtom = atom<Downloader[]>([]);
