import { createJSONStorage } from 'jotai/utils';
import { get, set, del } from 'idb-keyval';
import { AsyncStorage } from 'jotai/vanilla/utils/atomWithStorage';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const storage = createJSONStorage<any>(() => sessionStorage);

export function createIndexedDbStorage<T>(): AsyncStorage<T> {
    return {
        async getItem(key, initialValue) {
            const value = await get<T>(key);
            return value ?? initialValue;
        },
        async setItem(key, newValue) {
            await set(key, newValue);
        },
        async removeItem(key) {
            await del(key);
        },
    };
}
