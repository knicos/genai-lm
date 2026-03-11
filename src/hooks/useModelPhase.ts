import { TeachableLLM } from '@genai-fi/nanogpt';
import { useEffect, useState } from 'react';

export type ModelPhase = 'untrained' | 'pretrained' | 'finetuned';

export default function useModelPhase(model?: TeachableLLM) {
    const [, setStatus] = useState<ModelPhase>('untrained');
    useEffect(() => {
        if (model) {
            setStatus(model.phase);
            const h = (s: TeachableLLM['phase']) => {
                setStatus(s);
            };
            model.on('phase', h);
            return () => {
                model.off('phase', h);
            };
        }
    }, [model]);
    return model?.phase || 'untrained';
}
