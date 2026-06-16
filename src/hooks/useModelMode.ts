import { TeachableLLM, type ModelMode } from '@genai-fi/nanogpt';
import { useEffect, useState } from 'react';

export default function useModelMode(model?: TeachableLLM) {
    const [mode, setStatus] = useState<ModelMode>('untrained');
    useEffect(() => {
        if (model) {
            setStatus(model.mode);
            const h = (s: ModelMode) => {
                setStatus(s);
            };
            model.on('mode', h);
            return () => {
                model.off('mode', h);
            };
        }
    }, [model]);
    return mode;
}
