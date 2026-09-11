import style from './style.module.css';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconButton, TextField } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { Button } from '@genai-fi/base';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import type { ConversationHighlight, ExtendedGeneratorConversation } from '../../state/generator';
import TokenRender from './TokenRender';
import { TokenSelectState } from '../../state/uiState';

interface Props {
    item: ExtendedGeneratorConversation;
    active?: boolean;
    busy?: boolean;
    index: number;
    activeIndex?: number;
    editable?: boolean;
    highlightMode?: 'none' | 'confidence' | 'score';
    selectLength?: number;
    highlights?: ConversationHighlight[];
    onDelete?: () => void;
    onSelect?: (selection: TokenSelectState | null) => void;
}

export default function AssistantItem({
    item,
    active,
    busy,
    index,
    activeIndex,
    editable = false,
    highlightMode = 'none',
    selectLength = 0,
    highlights,
    onDelete,
    onSelect,
}: Props) {
    const ref = useRef<HTMLDivElement>(null);
    const { t } = useTranslation();
    const [editing, setEditing] = useState<boolean>(false);
    const [draft, setDraft] = useState<string>(item.content);

    useEffect(() => {
        if (active && ref.current) {
            ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
        }
    }, [active]);

    const content =
        item.content.length === 0 ? (
            <div
                ref={ref}
                className={`${style.assistantItem}`}
            >
                {t('conversation.botPlaceholder')}
            </div>
        ) : (item._output && highlightMode !== 'none') || selectLength > 0 ? (
            <TokenRender
                item={item}
                backgroundMode={highlightMode}
                index={index}
                activeIndex={activeIndex}
                onSelect={onSelect}
                selectLength={selectLength}
                highlights={highlights}
            />
        ) : (
            <div
                ref={ref}
                className={`${style.assistantItem} ${editable ? style.editable : ''} ${item.content.length === 0 ? style.injected : ''}`}
            >
                {item.content}
                {active && (
                    <div
                        className={`${style.cursor} ${busy ? style.active : ''}`}
                        data-testid="cursor"
                    ></div>
                )}
            </div>
        );

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
                content
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
                    {item._timestamp && (
                        <div className={style.timestamp}>{new Date(item._timestamp).toLocaleTimeString()}</div>
                    )}
                    <div style={{ flex: 1 }}></div>
                    {item._trainingOutput && (
                        <div className={style.trainingOutputBadge}>
                            {item._step
                                ? t('conversation.trainingStep', { step: item._step })
                                : t('conversation.trainingOutput')}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
