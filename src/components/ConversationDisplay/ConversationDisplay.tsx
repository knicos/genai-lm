import UserItem from './UserItem';
import AssistantItem from './AssistantItem';
import style from './style.module.css';
import { useRef } from 'react';
import { ExtendedConversation } from './extended';

interface Props {
    conversation: ExtendedConversation[];
}

export default function ConversationDisplay({ conversation }: Props) {
    const extendedConversation = useRef<ExtendedConversation[]>([]);
    const lastLength = useRef<number>(0);

    if (conversation.length !== lastLength.current) {
        lastLength.current = conversation.length;
        // Inject artificial user messages between consecutive assistant messages
        // Adjust a user message if it is empty
        // Only add new messages, keeping the original objects intact
        const extended: ExtendedConversation[] = [];
        conversation.forEach((part, index) => {
            if (part.role === 'assistant' && extended.length > 0) {
                const lastPart = extended[extended.length - 1];
                if (lastPart.role === 'assistant') {
                    // Inject artificial user message
                    extended.push({
                        role: 'auto_user',
                        content: 'Write something...',
                    });
                }
            }
            if (index === 0 && part.role === 'assistant') {
                // Inject artificial user message at the start if first message is from assistant
                extended.push({
                    role: 'auto_user',
                    content: 'Write something...',
                });
            }
            // Adjust empty user messages
            if (part.role === 'user' && part.content === '') {
                extended.push({
                    role: 'auto_user',
                    content: 'Write something...',
                });
            } else {
                extended.push(part);
            }
        });
        extendedConversation.current = extended;
    }

    return (
        <div className={style.conversationList}>
            {extendedConversation.current.map((part, index) =>
                part.role === 'user' || part.role === 'auto_user' ? (
                    <UserItem
                        key={index}
                        item={part}
                    />
                ) : (
                    <AssistantItem
                        key={index}
                        item={part}
                        active={index === extendedConversation.current.length - 1}
                        busy={!part._completed}
                    />
                )
            )}
        </div>
    );
}
