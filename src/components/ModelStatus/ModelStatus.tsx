import { TeachableLLM } from '@genai-fi/nanogpt';
import style from './style.module.css';
import { useEffect, useState } from 'react';

interface Props {
    model?: TeachableLLM;
}

type Status = 'warmup' | 'awaitingTokens' | 'ready' | 'training' | 'loading' | 'busy' | 'error' | 'none';

const Messages: Record<Status, string> = {
    warmup: 'Model is warming up...',
    ready: 'Model is ready',
    training: 'Model is training...',
    loading: 'Model is loading...',
    busy: 'Model is busy...',
    error: 'An error occurred with the model',
    none: 'No model loaded',
    awaitingTokens: 'Awaiting tokens...',
};

export default function ModelStatus({ model }: Props) {
    const [status, setStatus] = useState<Status>('none');

    useEffect(() => {
        if (!model) {
            setStatus('none');
            return;
        } else {
            setStatus(model.status);
            const h = (newStatus: Status) => {
                setStatus(newStatus);
            };
            model.on('status', h);
            return () => {
                model.off('status', h);
            };
        }
    }, [model]);

    return status === 'ready' || status === 'busy' ? null : (
        <div className={style.container}>{model ? <p>{Messages[status]}</p> : <p>No model loaded</p>}</div>
    );
}
