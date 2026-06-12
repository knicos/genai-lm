import { atom } from 'jotai';
import Downloader from '../utilities/downloader';
import { Conversation, DatasetMetadata, generateDatasetID, loadTextData } from '@genai-fi/nanogpt';
import { atomWithStorage } from 'jotai/utils';
import { createIndexedDbStorage } from './storage';
import { observe } from 'jotai-effect';
import { store } from './store';
import { set, get, del } from 'idb-keyval';
import EE from 'eventemitter3';
// import { modelAtom } from './model';

type DataEntryEvents = 'loading' | 'loaded' | 'error';

export class DataEntry implements DatasetMetadata {
    readonly id: string;
    readonly name: string;
    readonly source?: 'file' | 'input' | 'search';
    private _content: Conversation[][] | null = null;
    private _lazy: (() => Promise<Conversation[][]>) | null = null;
    private _promise: Promise<Conversation[][]> | null = null;
    private _downloader: Downloader | null = null;
    private _size: number | null = null;
    private ee = new EE<DataEntryEvents>();

    constructor(
        id: string,
        name: string,
        content?: Conversation[][] | (() => Promise<Conversation[][]>) | Downloader,
        source?: 'file' | 'input' | 'search'
    ) {
        this.id = id;
        this.name = name;
        this.source = source;
        if (content instanceof Downloader) {
            this._downloader = content;
            this._promise = new Promise((resolve, reject) => {
                if (!this._downloader) {
                    reject(new Error('Downloader not available'));
                    return;
                }
                this._downloader.on('error', (err) => {
                    this.ee.emit('error');
                    reject(err);
                });
                this._downloader.on('start', () => {
                    this.ee.emit('loading');
                });
                this._downloader.on('end', (file) => {
                    loadTextData(file)
                        .then((data) => {
                            this._content = data;
                            this._size = data.reduce((acc, curr) => acc + curr.length, 0);
                            this.storeInIndexedDB();
                            this.ee.emit('loaded');
                            resolve(data);
                        })
                        .catch(reject);
                });
            });
        } else if (typeof content === 'function') {
            this._lazy = content;
        } else if (Array.isArray(content)) {
            this._content = content;
            this._size = content.reduce((acc, curr) => acc + curr.length, 0);
            if (source === 'file' || source === 'input') {
                this.storeInIndexedDB();
            }
        }
    }

    on(event: DataEntryEvents, listener: () => void): void {
        this.ee.on(event, listener);
    }

    off(event: DataEntryEvents, listener: () => void): void {
        this.ee.off(event, listener);
    }

    get size(): number | null {
        return this._size;
    }

    get length() {
        return this._content ? this._content.length : 0;
    }

    get downloader() {
        return this._downloader;
    }

    get syncContent(): Conversation[][] | null {
        return this._content;
    }

    get invalid() {
        return !this._content && !this._lazy && !this._downloader;
    }

    set content(value: Conversation[][]) {
        this._content = value;
        this._size = value.reduce((acc, curr) => acc + curr.length, 0);
    }

    get content(): Promise<Conversation[][]> {
        if (this._content) {
            return Promise.resolve(this._content);
        } else if (this._lazy) {
            if (!this._promise) {
                this.ee.emit('loading');
                this._promise = this._lazy().then((data) => {
                    this._content = data;
                    this._size = data.reduce((acc, curr) => acc + curr.length, 0);
                    this.storeInIndexedDB();
                    this.ee.emit('loaded');
                    return data;
                });
            }
            return this._promise;
        } else if (this._downloader) {
            if (!this._promise) {
                throw new Error('Downloader promise not initialized');
            }
            if (!this._downloader.downloading) {
                this._downloader.start();
            }
            return this._promise;
        } else {
            return Promise.resolve([]);
        }
    }

    get hasLoaded(): boolean {
        return this._content !== null;
    }

    get isLoading(): boolean {
        return this._promise !== null && !this.hasLoaded && (this._downloader ? this._downloader.downloading : true);
    }

    get canLoad(): boolean {
        return this._downloader !== null || this._lazy !== null || this._content !== null;
    }

    public async load() {
        if (this._content) {
            return this._content;
        }
        if (this._lazy && !this._promise) {
            this.ee.emit('loading');
            this._promise = this._lazy().then((data) => {
                this._content = data;
                this._size = data.reduce((acc, curr) => acc + curr.length, 0);
                this.storeInIndexedDB();
                this.ee.emit('loaded');
                return data;
            });
            return this._promise;
        } else if (this._downloader) {
            if (!this._downloader.downloading) {
                this._downloader.start();
            }
            return this._promise;
        } else if (this._promise) {
            return this._promise;
        }
    }

    public dispose() {
        this._content = null;
        this._lazy = null;
        this._promise = null;
        if (this._downloader) {
            this._downloader.cancel();
            this._downloader = null;
        }
        this.ee.removeAllListeners();
        del(`dataitem_${this.id}_source`);
        del(`dataitem_${this.id}_content`);
        del(`dataitem_${this.id}_url`);
        del(`dataitem_${this.id}_type`);
    }

    private async storeInIndexedDB() {
        try {
            await set(`dataitem_${this.id}_source`, this.source);
            if (this.source === 'file' || this.source === 'input') {
                const { quota, usage } = await navigator.storage.estimate();
                if (quota !== undefined && usage !== undefined && quota - usage > (this._size || 0) * 2) {
                    await set(`dataitem_${this.id}_content`, this._content);
                }
            } else {
                await set(`dataitem_${this.id}_url`, this._downloader?.url);
                await set(`dataitem_${this.id}_type`, this._downloader?.type);
            }
        } catch (e) {
            console.warn('Failed to store data entry in IndexedDB', e);
        }
    }
}

export async function createEntriesFromManifest(manifest: DatasetMetadata[]): Promise<DataEntry[]> {
    return Promise.all(
        manifest.map(async (item) => {
            const storedSource: 'file' | 'input' | 'search' | undefined = await get(`dataitem_${item.id}_source`);
            if (storedSource) {
                if (storedSource === 'file' || storedSource === 'input') {
                    const storedContent: Conversation[][] | undefined = await get(`dataitem_${item.id}_content`);
                    if (storedContent) {
                        return new DataEntry(item.id, item.name, storedContent, storedSource);
                    }
                } else if (storedSource === 'search') {
                    const storedUrl: string | undefined = await get(`dataitem_${item.id}_url`);
                    const storedType: string | undefined = await get(`dataitem_${item.id}_type`);
                    if (storedUrl && storedType) {
                        const downloader = new Downloader(item.id, storedUrl, item.name, storedType);
                        return new DataEntry(item.id, item.name, downloader, storedSource);
                    }
                }
                return new DataEntry(item.id, item.name, undefined, storedSource);
            }
            return new DataEntry(item.id, item.name);
        })
    );
}

export interface DataEntryOld extends DatasetMetadata {
    id: string;
    name: string;
    content: Conversation[][];
    size: number;
    source: 'file' | 'input' | 'search';
}

export const dataEntries = atom<DataEntry[]>([]);

export const datasetIdAtom = atom<string>((get) => generateDatasetID(get(dataEntries)));

export const tokeniserInvalid = atom<boolean>(false);

export const dataReady = atom<boolean>((get) => {
    const entries = get(dataEntries);
    return entries.length > 0;
});

// Pre-training

export const downloadsAtom = atom<Downloader[]>([]);

export interface DataTokens {
    tokens: Uint16Array;
    tokeniserId: string;
    datasetId: string;
}

export const dataTokens = atom<DataTokens | null>(null);

observe((get) => {
    const dataset = get(dataTokens);
    if (dataset) {
        navigator.storage.estimate().then(({ quota, usage }) => {
            if (quota !== undefined && usage !== undefined && quota - usage > dataset.tokens.length * 2 * 1.5) {
                set('dataTokens_tokens', dataset.tokens);
                set('dataTokens_tokeniserId', dataset.tokeniserId);
                set('dataTokens_datasetId', dataset.datasetId);
            }
        });
    } else {
        // del('dataTokens');
    }
}, store);

/*observe((get, set) => {
    const model = get(modelAtom);
    if (model) {
        set(dataTokens, null);
    }
}, store);

observe((get, set) => {
    const entries = get(dataEntries);
    if (entries.length > 0) {
        set(dataTokens, null);
    }
}, store);*/

export const dataTokensReady = atom<boolean>((get) => {
    const tokens = get(dataTokens);
    return tokens !== null && tokens.tokens.length > 0;
});

// Fine-tuning
const initialValue: Conversation[][] = [];
export const conversationDataAtom = atomWithStorage<Conversation[][]>(
    'conversationData',
    initialValue,
    createIndexedDbStorage<Conversation[][]>()
);
