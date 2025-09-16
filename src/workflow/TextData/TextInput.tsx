import { useEffect, useRef } from 'react';
import style from './style.module.css';
import { Button } from '@genai-fi/base';
import { useTranslation } from 'react-i18next';

interface Props {
    initialText?: string;
    onText: (text: string) => void;
    onClose: () => void;
}

export default function TextInput({ initialText, onText, onClose }: Props) {
    const { t } = useTranslation();
    const ref = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (ref.current && initialText) {
            ref.current.value = initialText;
        }
    }, [initialText]);

    return (
        <div className={style.textInputContainer}>
            <textarea
                ref={ref}
                rows={10}
                autoComplete="off"
                placeholder={t('data.textPlaceholder')}
                autoCorrect="off"
            />
            <div className={style.buttonRow}>
                <Button
                    onClick={() => {
                        if (ref.current) {
                            onText(ref.current.value);
                        }
                    }}
                    variant="contained"
                >
                    {initialText ? t('data.save') : t('data.addText')}
                </Button>
                <Button
                    onClick={onClose}
                    variant="outlined"
                >
                    {t('data.cancel')}
                </Button>
            </div>
        </div>
    );
}
