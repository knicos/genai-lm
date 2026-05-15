import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

type SetQueryState<T extends string> = (value: T | null) => void;

export default function useQueryState<T extends string>(name: string): [T | null, SetQueryState<T>];

export default function useQueryState<T extends string>(name: string, defaultValue: T): [T, SetQueryState<T>];
export default function useQueryState<T extends string>(name: string, defaultValue?: T): [T | null, SetQueryState<T>] {
    const [searchParams, setSearchParams] = useSearchParams();

    const value = searchParams.get(name) ?? defaultValue ?? null;
    const setValue = useCallback(
        (newValue: T | null) => {
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                if (newValue === null) {
                    next.delete(name);
                } else {
                    next.set(name, newValue);
                }
                return next;
            });
        },
        [name, setSearchParams]
    );

    return [value as T | null, setValue];
}
