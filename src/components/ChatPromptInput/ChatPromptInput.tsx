import { useEffect, useRef, useState } from 'react';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import StopIcon from '@mui/icons-material/Stop';
import style from './style.module.css';
import { IconButton } from '@mui/material';

interface Props {
    onSend?: (value: string) => void;
    onStop?: () => void;
    placeholder?: string;
    disabled?: boolean;
    generating?: boolean;
}

export default function ChatPromptInput({
    onSend,
    onStop,
    placeholder = 'Send a message',
    disabled = false,
    generating = false,
}: Props) {
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
        if (!trimmed || disabled) return;
        onSend?.(trimmed);
        setText('');
    };

    return (
        <div className={`${style.shell} ${multiline ? style.multiline : ''}`}>
            <textarea
                ref={textareaRef}
                className={style.input}
                value={text}
                placeholder={generating ? '' : placeholder}
                rows={1}
                disabled={disabled || generating}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                }}
            />
            <div className={style.buttonRow}>
                <IconButton
                    className={style.sendButton}
                    aria-label="Send"
                    disabled={disabled || (!generating && text.trim().length === 0)}
                    onClick={generating ? onStop : handleSend}
                >
                    {generating ? <StopIcon fontSize="small" /> : <ArrowUpwardIcon fontSize="small" />}
                </IconButton>
            </div>
        </div>
    );
}
