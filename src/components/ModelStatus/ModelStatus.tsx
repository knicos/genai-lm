import { TeachableLLM } from '@genai-fi/nanogpt';
import style from './style.module.css';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
    model?: TeachableLLM;
}

type Status = 'warmup' | 'awaitingTokens' | 'ready' | 'training' | 'loading' | 'busy' | 'error' | 'none';

export default function ModelStatus({ model }: Props) {
    const { t } = useTranslation();
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
        <div className={style.container}>
            {model ? <p>{t(`modelStatus.${status}`)}</p> : <p>{t('modelStatus.none')}</p>}
        </div>
    );
}
