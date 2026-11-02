import UserItem from './UserItem';
import AssistantItem from './AssistantItem';
import style from './style.module.css';
import { useEffect, useReducer, useState, useRef } from 'react';
import type { GeneratorConversation } from '@genai-fi/nanogpt';
import type { TokenSelectState, HighlightMode } from '../../state/uiState';
import type { ConversationHighlight } from '../../state/generator';

interface Props {
    conversation?: GeneratorConversation[];
    editable?: boolean;
    highlightMode?: HighlightMode;
    selectLength?: number;
    highlights?: ConversationHighlight[];
    busy?: boolean;
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
    busy = false,
}: Props) {
    const [, forceRender] = useReducer((x) => x + 1, 0);
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
                        busy={busy ?? false}
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
        </div>
    );
}
