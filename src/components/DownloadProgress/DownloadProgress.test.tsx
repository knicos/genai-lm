import { describe, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import DownloadProgress from './DownloadProgress';
import Downloader from '../../utilities/downloader';
import EE from 'eventemitter3';

vi.mock('../../utilities/downloader', () => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    default: vi.fn(function Downloader(this: any) {
        this.ee = new EE();
        this.on = vi.fn((event: string, cb: () => void) => this.ee.on(event, cb));
        this.off = vi.fn((event: string, cb: () => void) => this.ee.off(event, cb));
        this.total = 100;
        this._loaded = 0;
    }),
}));

class TestDownloader extends Downloader {
    constructor(id: string, url: string, name: string, type: string) {
        super(id, url, name, type);
    }

    setLoaded(l: number) {
        this._loaded = l;
        this.ee.emit('progress');
    }

    get loaded() {
        return this._loaded;
    }
}

describe('DownloadProgress', () => {
    it('shows progress of one download', async ({ expect }) => {
        const downloader = new TestDownloader('id1', 'dummyurl', 'noname', 'text/plain');
        render(<DownloadProgress downloads={[downloader]} />);

        expect(screen.getByText('data.downloading')).toBeInTheDocument();
        expect(screen.getByTestId('progress-bar')).toHaveAttribute('aria-valuenow', '0');

        downloader.setLoaded(50);

        await waitFor(() => expect(screen.getByTestId('progress-bar')).toHaveAttribute('aria-valuenow', '50'));
    });
});
