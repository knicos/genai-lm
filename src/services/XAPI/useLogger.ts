import { useEffect } from 'react';
import { atom, useAtomValue, useStore } from 'jotai';
import { useLocation, useParams } from 'react-router';
import { loadedModelAtom } from '../../state/model';
import { getLogger, type Logger } from './logger';

const loggerAtom = atom<Logger | null>(null);

// Read the shared service without adding setup logic to components.
export function useLogger(): Logger | null {
    return useAtomValue(loggerAtom);
}

// Connect research mode and model changes once in the workspace.
export function useLoggerSetup(): void {
    const store = useStore();
    const logger = useLogger();
    const { search } = useLocation();
    const { variant, flow } = useParams();
    const audit = variant === 'audit' || flow === 'audit';

    useEffect(() => {
        let mounted = true;
        void getLogger().then((service) => {
            if (mounted) store.set(loggerAtom, service);
        });
        return () => {
            mounted = false;
        };
    }, [store, search]);

    useEffect(() => {
        if (!logger) return;

        const updateModel = () => logger.setModel(store.get(loadedModelAtom));
        updateModel();
        const unsubscribe = store.sub(loadedModelAtom, updateModel);

        return () => {
            unsubscribe();
            logger.setModel(null);
        };
    }, [logger, store]);

    useEffect(() => {
        if (!logger) return;

        logger.setAuditActive(audit);
        return () => logger.setAuditActive(false);
    }, [logger, audit]);
}
