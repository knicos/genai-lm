import { TeachableLLM } from '@genai-fi/nanogpt';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import BoxNotice from '../BoxTitle/BoxNotice';

interface Props {
    show: boolean;
    model?: TeachableLLM;
    onClose: () => void;
}

type Status = 'warmup' | 'awaitingTokens' | 'ready' | 'training' | 'loading' | 'busy' | 'error' | 'none';

export default function ModelStatus({ model, show, onClose }: Props) {
    const { t } = useTranslation();
    const [status, setStatus] = useState<Status>('none');
    const closeRef = useRef(onClose);
    closeRef.current = onClose;

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

    useEffect(() => {
        closeRef.current();
    }, [status]);

    return status === 'ready' || status === 'busy' || !show ? null : (
        <BoxNotice notice={{ notice: model ? t(`modelStatus.${status}`) : t('modelStatus.none'), level: 'info' }} />
    );
}
