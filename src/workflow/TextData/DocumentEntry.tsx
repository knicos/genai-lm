import { useTranslation } from 'react-i18next';
import { DataEntry } from '../../state/data';
import style from './ProgressiveDocumentFeed.module.css';
import { useState } from 'react';
import { IconButton, TextField } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { Button } from '@genai-fi/base';

export interface DocRef {
    key: string;
    entryIndex: number;
    contentIndex: number;
}

interface Props {
    data: DataEntry[];
    doc: DocRef;
    onUpdate: () => void;
}

export default function DocumentEntry({ data, doc, onUpdate }: Props) {
    const { t } = useTranslation();
    const [editing, setEditing] = useState(false);
    const entry = data[doc.entryIndex];
    const text = entry?.content?.[doc.contentIndex];
    const [draft, setDraft] = useState<string>(text);
    if (!entry || typeof text !== 'string') return null;

    return (
        <article
            key={doc.key}
            className={style.card}
        >
            <header className={style.header}>
                <h4 className={style.title}>
                    {entry.content.length > 1 ? `${entry.name} (${doc.contentIndex + 1})` : entry.name}
                </h4>
                <span className={style.meta}>{t('data.characters', { chars: text.length.toLocaleString() })}</span>
            </header>

            <div className={style.body}>
                {!editing && (
                    <>
                        <p className={style.paragraph}>{text}</p>
                        <div className={style.actions}>
                            <IconButton
                                size="small"
                                color="primary"
                                onClick={() => {
                                    setEditing(true);
                                    setDraft(text);
                                }}
                            >
                                <EditIcon fontSize="small" />
                            </IconButton>
                        </div>
                    </>
                )}
                {editing && (
                    <div className={style.editingContainer}>
                        <TextField
                            multiline
                            rows={8}
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                        />
                        <div className={style.editActions}>
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    setEditing(false);
                                    setDraft(text);
                                }}
                            >
                                {t('data.cancel')}
                            </Button>
                            <Button
                                variant="contained"
                                onClick={() => {
                                    if (entry) {
                                        entry.content[doc.contentIndex] = draft;
                                    }
                                    onUpdate();
                                    setEditing(false);
                                }}
                            >
                                {t('data.save')}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </article>
    );
}
