import { TeachableLLM } from '@genai-fi/nanogpt';
import { useEffect, useState } from 'react';

export default function useModelBusy(model?: TeachableLLM) {
    const [, setStatus] = useState<boolean>(false);
    useEffect(() => {
        if (model) {
            setStatus(model.busy);
            const h = () => {
                setStatus(model.busy);
            };
            model.on('status', h);
            return () => {
                model.off('status', h);
            };
        }
    }, [model]);
    return model?.busy || false;
}
