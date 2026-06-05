import { useEffect, useState } from 'react';
import { DataEntry } from '../state/data';

export default function useDataEntryStatus(entry: DataEntry) {
    const [status, setStatus] = useState<'waiting' | 'loading' | 'loaded' | 'error'>(
        entry.isLoading ? 'loading' : entry.hasLoaded ? 'loaded' : 'waiting'
    );

    useEffect(() => {
        const onLoading = () => setStatus('loading');
        const onLoaded = () => setStatus('loaded');
        const onError = () => setStatus('error');
        entry.on('loading', onLoading);
        entry.on('loaded', onLoaded);
        entry.on('error', onError);

        return () => {
            entry.off('loading', onLoading);
            entry.off('loaded', onLoaded);
            entry.off('error', onError);
        };
    }, [entry]);

    return status;
}
