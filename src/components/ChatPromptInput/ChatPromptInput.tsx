import { useEffect, useRef, useState } from 'react';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import StopIcon from '@mui/icons-material/Stop';
import style from './style.module.css';
import { IconButton } from '@mui/material';
import { Button } from '@genai-fi/base';
import { useTranslation } from 'react-i18next';

interface Props {
    onSend?: (value: string) => void;
    onStop?: () => void;
    onChange?: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    generating?: boolean;
    noPrompt?: boolean;
}

export default function ChatPromptInput({
    onSend,
    onStop,
    onChange,
    placeholder = 'Send a message',
    disabled = false,
    generating = false,
    noPrompt = false,
}: Props) {
    const { t } = useTranslation();
    const [text, setText] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [multiline, setMultiline] = useState(false);

    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.flexBasis = '0px';
        el.style.height = '0px';
        const scrollHeight = Math.min(el.scrollHeight, 160);
        el.style.flexBasis = `${scrollHeight}px`;
        el.style.height = `${scrollHeight}px`;

        if (text.indexOf('\n') >= 0) {
            setMultiline(true);
        } else {
            setMultiline(false);
        }

        if (!generating) {
            textareaRef.current?.focus();
        }
    }, [text, generating]);

    const handleSend = () => {
        const trimmed = text.trim();
        if (disabled) return;
        onSend?.(trimmed);
        setText('');
    };

    return (
        <div className={`${style.shell} ${multiline ? style.multiline : ''}`}>
            {!noPrompt && (
                <textarea
                    ref={textareaRef}
                    className={style.input}
                    value={text}
                    placeholder={generating ? '' : placeholder}
                    rows={1}
                    disabled={disabled || generating}
                    onChange={(e) => {
                        setText(e.target.value);
                        if (onChange) {
                            onChange(e.target.value);
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                />
            )}
            <div
                className={style.buttonRow}
                style={noPrompt ? { width: '100%' } : undefined}
            >
                {!noPrompt && (
                    <IconButton
                        className={style.sendButton}
                        aria-label="Send"
                        disabled={disabled || (!generating && text.trim().length === 0)}
                        onClick={generating ? onStop : handleSend}
                    >
                        {generating ? <StopIcon fontSize="small" /> : <ArrowUpwardIcon fontSize="small" />}
                    </IconButton>
                )}
                {noPrompt && (
                    <Button
                        onClick={generating ? onStop : handleSend}
                        disabled={disabled}
                        fullWidth
                        variant="contained"
                    >
                        {generating ? t('generator.stop') : t('generator.generate')}
                    </Button>
                )}
            </div>
        </div>
    );
}
