import { TeachableLLM } from '@genai-fi/nanogpt';
import { useEffect, useState } from 'react';

export default function useModelLoaded(model?: TeachableLLM) {
    const [, setStatus] = useState<boolean>(false);
    useEffect(() => {
        if (model) {
            setStatus(model.loaded);
            const h = () => {
                setStatus(model.loaded);
            };
            model.on('status', h);
            return () => {
                model.off('status', h);
            };
        }
    }, [model]);
    return model?.loaded || false;
}
