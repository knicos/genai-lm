import EE from 'eventemitter3';
import { useEffect } from 'react';

export type GlobalEvents = 'step';

const globalEvents = new EE();

export { globalEvents };

export function useEvent<T extends GlobalEvents>(
    event: T,
    handler: (...args: unknown[]) => void,
    deps: unknown[] = []
) {
    useEffect(() => {
        globalEvents.on(event, handler);
        return () => {
            globalEvents.off(event, handler);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [event, handler, ...deps]);
}

export function emitEvent<T extends GlobalEvents>(event: T, ...args: unknown[]) {
    globalEvents.emit(event, ...args);
}
