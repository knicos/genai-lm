import { atom } from 'jotai';
import Downloader from '../utilities/downloader';
import { Conversation, DatasetMetadata, ConversationStream, data as dataModule, tokenise } from '@genai-fi/nanogpt';
import { atomWithStorage } from 'jotai/utils';
import { createOPFSStorage, set, get, del, storage } from './storage';
import EE from 'eventemitter3';
import { uiDeveloperMode } from './uiState';
import { firstConversation } from '../utilities/conversation';
import { setData } from '../utilities/db';
import { observe } from 'jotai-effect';
import { store } from './store';

export interface DataManifestEntry {
    id: string;
    title: string;
    url: string;
    language: string;
    conversational: boolean;
    complexity: 'low' | 'medium' | 'high';
    mime: string;
    restricted: boolean;
    size: number;
    modality: 'text';
    rating: number;
    sampleContent?: string;
    tags: string[];
}

interface DataManifest {
    datasets: DataManifestEntry[];
}

export const dataManifestLanguage = atom<string>('en');

export const dataManifest = atom(async (get) => {
    const lang = get(dataManifestLanguage);
    const isDev = get(uiDeveloperMode);
    try {
        const response = await fetch(`${import.meta.env.VITE_APP_API}/datasets?lang=${lang}`);
        const data: DataManifest = await response.json();

        const tags = new Map<string, DataManifestEntry[]>();
        data.datasets.forEach((entry) => {
            if (entry.restricted && !isDev) {
                return;
            }
            entry.tags.forEach((tag) => {
                if (!tags.has(tag)) {
                    tags.set(tag, []);
                }
                tags.get(tag)?.push(entry);
            });
        });

        return Array.from(tags.entries()).map(([name, datasets]) => ({
            title: name,
            cards: datasets,
        }));
    } catch {
        return null;
    }
});

type DataEntryEvents = 'loading' | 'loaded' | 'error';

export class DataEntry implements DatasetMetadata {
    readonly id: string;
    readonly name: string;
    public conversational = false;
    readonly source?: 'file' | 'input' | 'search';
    private _stream: ConversationStream | null = null;
    private _content: Conversation[][] | null = null;
    private _lazy: (() => Promise<Conversation[][]>) | null = null;
    private _promise: Promise<void> | null = null;
    private _downloader: Downloader | null = null;
    private _size: number | null = null;
    private ee = new EE<DataEntryEvents>();

    constructor(
        id: string,
        name: string,
        content?: Conversation[][] | (() => Promise<Conversation[][]>) | Downloader | ConversationStream,
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
                    dataModule
                        .loadTextData(file)
                        .then((data) => {
                            this._stream = data;
                            firstConversation(data).then((conversation) => {
                                this.conversational = conversation.some((part) => part.role !== 'text');
                                this.storeInIndexedDB();
                                this.ee.emit('loaded');
                                resolve();
                            });
                        })
                        .catch(reject);
                });
            });
        } else if (typeof content === 'function') {
            this._lazy = content;
        } else if (Array.isArray(content)) {
            this._stream = new dataModule.MemoryConversationStream(content);
            this._content = content;
            this.conversational = content.some((conv) => conv[0]?.role !== 'text');
            this._size = content.reduce((acc, curr) => acc + curr.length, 0);
            if (source === 'file' || source === 'input') {
                this.storeInIndexedDB();
            }
        } else {
            this._stream = content || null;
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

    get downloader() {
        return this._downloader;
    }

    get invalid() {
        return !this._stream && !this._lazy && !this._downloader;
    }

    get content(): Conversation[][] | null {
        return this._content;
    }

    set content(value: Conversation[][] | null) {
        if (this._content === null) {
            throw new Error('Cannot set content on a DataEntry that was not initialized with content');
        }
        this._content = value;
        this._stream = value ? new dataModule.MemoryConversationStream(value) : null;
    }

    set stream(value: Conversation[][] | ConversationStream | null) {
        if (Array.isArray(value)) {
            this._stream = new dataModule.MemoryConversationStream(value);
            this._size = value.reduce((acc, curr) => acc + curr.length, 0);
            this.conversational = value.some((conv) => conv[0]?.role !== 'text');
        } else {
            this._stream = value;
            this._size = 0;
            this.conversational = false;
        }
    }

    get stream(): Promise<ConversationStream> {
        if (this._stream) {
            return Promise.resolve(this._stream);
        } else if (this._lazy) {
            if (!this._promise) {
                this.ee.emit('loading');
                this._promise = this._lazy().then((data) => {
                    this._stream = new dataModule.MemoryConversationStream(data);
                    this.conversational = data.some((conv) => conv[0]?.role !== 'text');
                    this._size = data.reduce((acc, curr) => acc + curr.length, 0);
                    this.storeInIndexedDB();
                    this.ee.emit('loaded');
                });
            }
            return this._promise.then(() => {
                if (!this._stream) {
                    throw new Error('Content not loaded');
                }
                return this._stream;
            });
        } else if (this._downloader) {
            if (!this._promise) {
                throw new Error('Downloader promise not initialized');
            }
            if (!this._downloader.downloading) {
                this._downloader.start();
            }
            return this._promise.then(() => {
                if (!this._stream) {
                    throw new Error('Content not loaded');
                }
                return this._stream;
            });
        } else {
            return Promise.resolve(new dataModule.MemoryConversationStream([]));
        }
    }

    get hasLoaded(): boolean {
        return this._stream !== null;
    }

    get isLoading(): boolean {
        return this._promise !== null && !this.hasLoaded && (this._downloader ? this._downloader.downloading : true);
    }

    get canLoad(): boolean {
        return this._downloader !== null || this._lazy !== null || this._stream !== null;
    }

    public async load() {
        if (this._stream) {
            return this._stream;
        }
        if (this._lazy && !this._promise) {
            this.ee.emit('loading');
            this._promise = this._lazy().then((data) => {
                this._stream = new dataModule.MemoryConversationStream(data);
                this.conversational = data.some((conv) => conv[0]?.role !== 'text');
                this._size = data.reduce((acc, curr) => acc + curr.length, 0);
                this.storeInIndexedDB();
                this.ee.emit('loaded');
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
        this._stream = null;
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
            set(`dataitem_${this.id}_source`, this.source ?? null);
            if (this.source === 'file' || this.source === 'input') {
                // Don't store files. They might be too large and risk sharing data with others.
                /*const { quota, usage } = await navigator.storage.estimate();
                if (quota !== undefined && usage !== undefined && quota - usage > (this._size || 0) * 2) {
                    await set(`dataitem_${this.id}_content`, this._content);
                }*/
            } else {
                set(`dataitem_${this.id}_url`, this._downloader?.url ?? null);
                set(`dataitem_${this.id}_type`, this._downloader?.type ?? null);
            }
        } catch (e) {
            console.warn('Failed to store data entry in IndexedDB', e);
        }
    }
}

export async function createEntriesFromManifest(manifest: DatasetMetadata[]): Promise<DataEntry[]> {
    return Promise.all(
        manifest.map(async (item) => {
            const storedSource: 'file' | 'input' | 'search' | null = await get(`dataitem_${item.id}_source`);
            if (storedSource) {
                if (storedSource === 'file' || storedSource === 'input') {
                    const storedContent: Conversation[][] | null = await get(`dataitem_${item.id}_content`);
                    if (storedContent) {
                        return new DataEntry(item.id, item.name, storedContent, storedSource);
                    }
                } else if (storedSource === 'search') {
                    const storedUrl: string | null = await get(`dataitem_${item.id}_url`);
                    const storedType: string | null = await get(`dataitem_${item.id}_type`);
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

export const datasetIdAtom = atom<string>((get) => dataModule.generateDatasetID(get(dataEntries)));

export const tokeniserInvalid = atom<boolean>(false);

export const dataReady = atom<boolean>((get) => {
    const entries = get(dataEntries);
    return entries.length > 0;
});

// Pre-training

export const downloadsAtom = atom<Downloader[]>([]);

export interface DataTokens {
    tokens: tokenise.TokenStore;
    tokeniserId: string;
    datasetId: string;
}

export const dataTokens = atom<DataTokens | null>(null);
export const validationTokens = atom<DataTokens | null>(null);

observe((get) => {
    const dataset = get(dataTokens);
    if (dataset) {
        setData(dataset.tokeniserId, dataset.datasetId);
    } else {
        // del('dataTokens');
    }
}, store);

export const dataTokensReady = atom<boolean>((get) => {
    const tokens = get(dataTokens);
    return tokens !== null && tokens.tokens.getTokenCount() > 0;
});

// Fine-tuning
const initialValue: Conversation[][] = [];
export const conversationDataAtom = atomWithStorage<Conversation[][]>(
    'conversationData',
    initialValue,
    createOPFSStorage<Conversation[][]>()
);

export const allowRecordAtom = atom<boolean>(false);

interface TokeniseSettings {
    validationSplit: number;
    saveToOPFS: boolean;
}

export const tokeniseSettingsAtom = atomWithStorage<TokeniseSettings>(
    'tokeniseSettings',
    {
        validationSplit: 0.1,
        saveToOPFS: true,
    },
    storage
);
