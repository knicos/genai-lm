import { MouseEvent, useEffect, useRef, useState } from 'react';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import StopIcon from '@mui/icons-material/Stop';
import style from './style.module.css';
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import { Button } from '@genai-fi/base';
import { useTranslation } from 'react-i18next';
import SettingsIcon from '@mui/icons-material/Settings';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ChatIcon from '@mui/icons-material/Chat';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';

interface Props {
    onSend?: (value: string) => void;
    onStop?: () => void;
    onChange?: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    generating?: boolean;
    noPrompt?: boolean;
    promptMode?: 'none' | 'completion' | 'conversation';
    onPromptModeChange?: (mode: 'none' | 'completion' | 'conversation') => void;
    conversationSupported?: boolean;
}

export default function ChatPromptInput({
    onSend,
    onStop,
    onChange,
    placeholder = 'Send a message',
    disabled = false,
    generating = false,
    noPrompt = false,
    promptMode,
    onPromptModeChange,
    conversationSupported = false,
}: Props) {
    const { t } = useTranslation();
    const [text, setText] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [multiline, setMultiline] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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
        <div className={style.container}>
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
            {promptMode && onPromptModeChange && (
                <>
                    <IconButton
                        color="primary"
                        size="medium"
                        onClick={(e: MouseEvent) => {
                            setAnchorEl(e.currentTarget as HTMLElement);
                        }}
                        disabled={disabled}
                    >
                        <SettingsIcon fontSize="large" />
                    </IconButton>
                    <Menu
                        id={`model-menu`}
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={() => setAnchorEl(null)}
                        anchorOrigin={{
                            vertical: 'top',
                            horizontal: 'center',
                        }}
                        transformOrigin={{
                            vertical: 'bottom',
                            horizontal: 'center',
                        }}
                    >
                        <MenuItem
                            disabled={disabled}
                            selected={promptMode === 'none'}
                            onClick={() => {
                                onPromptModeChange('none');
                                setAnchorEl(null);
                            }}
                        >
                            <ListItemIcon>
                                <AutoAwesomeIcon color="inherit" />
                            </ListItemIcon>
                            <ListItemText>{t('app.settings.promptModeNone')}</ListItemText>
                        </MenuItem>
                        <MenuItem
                            disabled={disabled}
                            selected={promptMode === 'completion'}
                            onClick={() => {
                                onPromptModeChange('completion');
                                setAnchorEl(null);
                            }}
                        >
                            <ListItemIcon>
                                <MoreHorizIcon color="inherit" />
                            </ListItemIcon>
                            <ListItemText>{t('app.settings.promptModeCompletion')}</ListItemText>
                        </MenuItem>
                        {conversationSupported && (
                            <MenuItem
                                disabled={disabled}
                                selected={promptMode === 'conversation'}
                                onClick={() => {
                                    onPromptModeChange('conversation');
                                    setAnchorEl(null);
                                }}
                            >
                                <ListItemIcon>
                                    <ChatIcon color="inherit" />
                                </ListItemIcon>
                                <ListItemText>{t('app.settings.promptModeConversation')}</ListItemText>
                            </MenuItem>
                        )}
                    </Menu>
                </>
            )}
        </div>
    );
}
