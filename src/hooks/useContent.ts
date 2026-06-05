import { useEffect } from 'react';
import { DataEntry } from '../state/data';

export default function useContent(entry: DataEntry) {
    useEffect(() => {
        entry.load();
    }, [entry]);

    return entry.syncContent;
}
