import { IconButton, TextField } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import DoneIcon from '@mui/icons-material/Done';
import style from './lora.module.css';
import { useTranslation } from 'react-i18next';

interface Props {
    onDone: (name?: string) => void;
}

export default function NewLoRA({ onDone }: Props) {
    const [name, setName] = useState('');
    const { t } = useTranslation();
    const ref = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<boolean>(false);

    useEffect(() => {
        if (ref.current) {
            ref.current.focus();
        }
    }, []);

    const handleDone = () => {
        const trimmed = name.trim();

        if (trimmed === '') {
            onDone();
            return;
        }

        if (trimmed.length > 30) {
            setError(true);
            return;
        }

        if (trimmed.length < 3) {
            setError(true);
            return;
        }

        setError(false);
        onDone(trimmed);
    };

    return (
        <div className={style.newContainer}>
            <TextField
                error={error}
                size="small"
                inputRef={ref}
                placeholder={t('instruct.loraName')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                    setError(false);
                    if (e.key === 'Enter') {
                        handleDone();
                    }
                    if (e.key === 'Escape') {
                        onDone();
                    }
                }}
            />
            <IconButton onClick={handleDone}>
                <DoneIcon />
            </IconButton>
        </div>
    );
}
