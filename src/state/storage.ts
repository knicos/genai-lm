import { createJSONStorage } from 'jotai/utils';
import { AsyncStorage } from 'jotai/vanilla/utils/atomWithStorage';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const storage = createJSONStorage<any>(() => localStorage);

const dirPromise = (async () => {
    if (navigator?.storage?.getDirectory) {
        return await navigator.storage.getDirectory();
    }
    return null;
})();

function opfsKey(key: string) {
    return `genai_${encodeURIComponent(key)}`;
}

export async function getOPFSBlob(key: string): Promise<Blob | null> {
    const dir = await dirPromise;
    if (!dir) {
        return get<Blob | null>(key) ?? null;
    }

    const name = opfsKey(key);
    try {
        const handle = await dir.getFileHandle(name);
        const file = await handle.getFile();
        return file;
    } catch {
        return null;
    }
}

export async function setOPFSBlob(key: string, blob: Blob) {
    const dir = await dirPromise;

    const name = opfsKey(key);

    if (!dir) {
        return;
    }

    const handle = await dir.getFileHandle(name, { create: true });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
}

export async function getOPFS<T>(key: string, initialValue: T): Promise<T> {
    const dir = await dirPromise;
    if (!dir) {
        return get<T>(key) ?? initialValue;
    }

    const name = opfsKey(key);
    try {
        const handle = await dir.getFileHandle(name);
        const file = await handle.getFile();
        const text = await file.text();
        return (text.length ? JSON.parse(text) : initialValue) as T;
    } catch {
        return initialValue;
    }
}

export async function setOPFS<T>(key: string, newValue: T) {
    const dir = await dirPromise;

    const name = opfsKey(key);

    if (!dir) {
        set(key, newValue);
        return;
    }

    if (newValue === null) {
        try {
            await dir.removeEntry(name);
        } catch {
            // ignore if not present
        }
        return;
    }

    const handle = await dir.getFileHandle(name, { create: true });
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(newValue));
    await writable.close();
}

export async function delOPFS(key: string) {
    const dir = await dirPromise;
    const name = opfsKey(key);

    if (!dir) {
        del(key);
        return;
    }

    try {
        await dir.removeEntry(name);
    } catch {
        // ignore if not present
    }
}

export function createOPFSStorage<T>(): AsyncStorage<T> {
    return {
        async getItem(key, initialValue) {
            return getOPFS<T>(key, initialValue);
        },

        async setItem(key, newValue) {
            return setOPFS<T>(key, newValue);
        },

        async removeItem(key) {
            return delOPFS(key);
        },
    };
}

export function set(key: string, value: unknown) {
    localStorage.setItem(key, JSON.stringify(value));
}

export function get<T>(key: string): T | null {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : null;
}

export function del(key: string) {
    localStorage.removeItem(key);
}
