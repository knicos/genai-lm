import { TeachableLLM } from '@genai-fi/nanogpt';
import { useEffect, useState } from 'react';

export default function useModelStatus(model?: TeachableLLM) {
    const [status, setStatus] = useState<TeachableLLM['status']>('loading');
    useEffect(() => {
        if (model) {
            setStatus(model.status);
            const h = (s: TeachableLLM['status']) => {
                setStatus(s);
            };
            model.on('status', h);
            return () => {
                model.off('status', h);
            };
        }
    }, [model]);
    return status;
}
