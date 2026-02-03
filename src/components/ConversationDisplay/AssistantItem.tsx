import style from './style.module.css';
import { useEffect, useRef, useState } from 'react';
import { ExtendedConversation } from './extended';
import { useTranslation } from 'react-i18next';
import { IconButton, TextField } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { Button } from '@genai-fi/base';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

interface Props {
    item: ExtendedConversation;
    active?: boolean;
    busy?: boolean;
    editable?: boolean;
    onDelete?: () => void;
}

export default function AssistantItem({ item, active, busy, editable = false, onDelete }: Props) {
    const ref = useRef<HTMLDivElement>(null);
    const { t } = useTranslation();
    const [editing, setEditing] = useState<boolean>(false);
    const [draft, setDraft] = useState<string>(item.content);

    useEffect(() => {
        if (active && ref.current) {
            ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
        }
    }, [active]);

    return (
        <div className={style.assistantContainer}>
            {editing ? (
                <div className={style.assistantEditing}>
                    <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        size="small"
                        variant="outlined"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder={t('conversation.botPlaceholder')}
                        autoFocus
                    />
                    <div className={style.editActions}>
                        <Button
                            variant="outlined"
                            onClick={() => {
                                setEditing(false);
                                setDraft(item.content);
                            }}
                        >
                            {t('conversation.cancel')}
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => {
                                item.content = draft;
                                setEditing(false);
                            }}
                        >
                            {t('conversation.save')}
                        </Button>
                    </div>
                </div>
            ) : (
                <div
                    ref={ref}
                    className={`${style.assistantItem} ${editable ? style.editable : ''} ${item.content.length === 0 ? style.injected : ''}`}
                >
                    {item.content.length === 0 ? t('conversation.botPlaceholder') : item.content}
                    {active && (
                        <div
                            className={`${style.cursor} ${busy ? style.active : ''}`}
                            data-testid="cursor"
                        ></div>
                    )}
                </div>
            )}
            {!editing && (
                <div className={style.assistantActions}>
                    <IconButton
                        size="small"
                        color="primary"
                        onClick={() => {
                            navigator.clipboard.writeText(item.content);
                        }}
                    >
                        <ContentCopyIcon fontSize="small" />
                    </IconButton>
                    {editable && (
                        <>
                            <IconButton
                                size="small"
                                color="primary"
                                onClick={() => {
                                    setEditing(true);
                                    setDraft(item.content);
                                }}
                            >
                                <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                                size="small"
                                color="primary"
                                onClick={() => {
                                    if (onDelete) {
                                        onDelete();
                                    }
                                }}
                            >
                                <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
