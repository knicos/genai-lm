import style from './style.module.css';
import { ExtendedConversation } from './extended';
import { useState } from 'react';
import { IconButton, TextField } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { useTranslation } from 'react-i18next';
import { Button } from '@genai-fi/base';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

interface Props {
    item: ExtendedConversation;
    editable?: boolean;
    onDelete?: () => void;
}

export default function UserItem({ item, editable = false, onDelete }: Props) {
    const { t } = useTranslation();
    const [editing, setEditing] = useState<boolean>(false);
    const [draft, setDraft] = useState<string>(item.content);

    return (
        <div className={`${style.userContainer} ${editing ? style.editing : ''}`}>
            {!editing && (
                <div className={`${style.userActions} ${editable ? style.editable : ''}`}>
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

            {!editing ? (
                <div className={`${style.userItem} ${item.content === '' ? style.injected : ''}`}>
                    {item.content.length === 0 ? t('conversation.userPlaceholder') : item.content}
                </div>
            ) : (
                <div className={style.userEditing}>
                    <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        size="small"
                        variant="outlined"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder={t('conversation.userPlaceholder')}
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
            )}
        </div>
    );
}
