import EE from 'eventemitter3';

export type DownloadEvents = 'start' | 'progress' | 'end' | 'error' | 'cancel';

export default class Downloader {
    protected ee = new EE<DownloadEvents>();
    public readonly url: string;
    public readonly name: string;
    public readonly type: string;
    public readonly id: string;
    private file?: File;
    protected _total = 0;
    protected _loaded = 0;
    protected _cancelled = false;
    private controller = new AbortController();

    get loaded() {
        return this._loaded;
    }

    get total() {
        return this._total;
    }

    constructor(id: string, url: string, name: string, type: string) {
        this.id = id;
        this.url = url;
        this.name = name;
        this.type = type;
    }

    private async start() {
        this._cancelled = false;

        this.ee.emit('start');
        try {
            const response = await fetch(this.url, { signal: this.controller.signal });

            if (!response.ok || !response.body) {
                throw new Error(`Failed to download file: ${response.statusText}`);
            }

            const contentLength = response.headers.get('Content-Length');
            const total = contentLength ? parseInt(contentLength, 10) : 0;
            this._total = total;
            let loaded = 0;

            const reader = response.body.getReader();
            const chunks: BlobPart[] = [];

            while (!this._cancelled) {
                const { done, value } = await reader.read();
                if (done) break;
                if (this._cancelled) break;
                if (value) {
                    chunks.push(value);
                    loaded += value.length;
                    this._loaded = loaded;
                    this.ee.emit('progress', loaded, total);
                }
            }

            if (this._cancelled) {
                this.ee.emit('cancel');
                return;
            }

            const file = new File(chunks, this.name, { type: this.type });
            this.file = file;
            this.ee.emit('end', file);
        } catch (error) {
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    this.ee.emit('cancel');
                    return;
                }
            }
            this.ee.emit('error', error);
        }
    }

    public getFile(): File | undefined {
        return this.file;
    }

    public cancel() {
        this._cancelled = true;
        this.controller.abort();
    }

    on(event: 'start', listener: () => void): void;
    on(event: 'progress', listener: (loaded: number, total: number) => void): void;
    on(event: 'end', listener: (file: File) => void): void;
    on(event: 'error', listener: (error: unknown) => void): void;
    on(event: 'cancel', listener: () => void): void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public on(event: DownloadEvents, listener: (...args: any[]) => void) {
        if (event === 'end' && this.file) {
            listener(this.file);
            return;
        }
        this.ee.on(event, listener);
    }

    off(event: 'start', listener: () => void): void;
    off(event: 'progress', listener: (loaded: number, total: number) => void): void;
    off(event: 'end', listener: (file: File) => void): void;
    off(event: 'error', listener: (error: unknown) => void): void;
    off(event: 'cancel', listener: () => void): void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public off(event: DownloadEvents, listener: (...args: any[]) => void) {
        this.ee.off(event, listener);
    }

    static downloadFile(id: string, url: string, name: string, type: string): Downloader {
        const downloader = new Downloader(id, url, name, type);
        downloader.start();
        return downloader;
    }
}
