import UserItem from './UserItem';
import AssistantItem from './AssistantItem';
import style from './style.module.css';
import { useEffect, useReducer, useState, useRef } from 'react';

import { Button } from '@genai-fi/base';
import { useTranslation } from 'react-i18next';
import AddBoxIcon from '@mui/icons-material/AddBox';
import type { GeneratorConversation } from '@genai-fi/nanogpt';
import type { TokenSelectState } from '../../state/uiState';
import type { ConversationHighlight } from '../../state/generator';

interface Props {
    conversation?: GeneratorConversation[];
    editable?: boolean;
    highlightMode?: 'none' | 'confidence' | 'score';
    selectLength?: number;
    highlights?: ConversationHighlight[];
    onRetry?: (index: number) => void;
    onSelect?: (selection: TokenSelectState | null) => void;
}

export default function ConversationDisplay({
    conversation,
    onRetry,
    onSelect,
    editable = false,
    highlightMode = 'none',
    selectLength = 0,
    highlights,
}: Props) {
    const [, forceRender] = useReducer((x) => x + 1, 0);
    const { t } = useTranslation();
    const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
    const listRef = useRef<HTMLDivElement>(null);
    const lengthRef = useRef<number>(0);

    useEffect(() => {
        if (onSelect) {
            onSelect(null);
        }
        if (listRef.current && conversation && conversation.length !== lengthRef.current) {
            setTimeout(() => {
                if (listRef.current) {
                    listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
                }
            }, 100);
        }
        lengthRef.current = conversation?.length ?? 0;
    }, [conversation, onSelect]);

    return (
        <div
            className={style.conversationList}
            ref={listRef}
        >
            {conversation?.map((part, index) =>
                part.role === 'user' ? (
                    <UserItem
                        key={index}
                        index={index}
                        item={part}
                        editable={editable}
                        onRetry={onRetry}
                        onDelete={
                            editable
                                ? () => {
                                      if (editable) {
                                          conversation.splice(index, 1);
                                          forceRender();
                                      }
                                  }
                                : undefined
                        }
                    />
                ) : (
                    <AssistantItem
                        key={index}
                        index={index}
                        item={part}
                        active={!editable && index === conversation.length - 1}
                        busy={!part._completed}
                        editable={editable}
                        highlightMode={highlightMode}
                        selectLength={selectLength}
                        highlights={highlights}
                        onSelect={(selection) => {
                            setActiveIndex(index);
                            if (onSelect) {
                                onSelect(selection);
                            }
                        }}
                        activeIndex={activeIndex}
                        onDelete={
                            editable
                                ? () => {
                                      if (editable) {
                                          conversation.splice(index, 1);
                                          forceRender();
                                      }
                                  }
                                : undefined
                        }
                    />
                )
            )}
            {editable && (
                <div className={style.buttonRow}>
                    <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<AddBoxIcon />}
                        disabled={conversation === undefined}
                        onClick={() => {
                            conversation?.push({
                                role:
                                    conversation.length === 0 ||
                                    conversation[conversation.length - 1].role === 'assistant'
                                        ? 'user'
                                        : 'assistant',
                                content: '',
                            });
                            forceRender();
                        }}
                    >
                        {t('conversation.addMessage')}
                    </Button>
                </div>
            )}
        </div>
    );
}
