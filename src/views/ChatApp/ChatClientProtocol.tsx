import { usePeerData, usePeerSender } from '@genai-fi/base/hooks/peer';
import { EventProtocol } from '../../components/PeerShare/events';
import { Conversation } from '@genai-fi/nanogpt';
import { useEffect, useRef } from 'react';

interface Props {
    conversation: Conversation[];
    onResponse: (response: string, completed: boolean) => void;
    onIdChange?: (id: string) => void;
}

export default function ChatClientProtocol({ conversation, onResponse, onIdChange }: Props) {
    const id = useRef<string | null>(null);
    const send = usePeerSender<EventProtocol>();

    useEffect(() => {
        if (conversation.length > 0 && conversation[conversation.length - 1].role === 'user') {
            send({ event: 'chat', input: conversation, stream: true });
        }
    }, [conversation, send]);

    usePeerData(async (data: EventProtocol) => {
        if (data.event === 'response') {
            onResponse(data.output.content, data.completed);
            if (data.conversation && data.conversation !== id.current) {
                id.current = data.conversation;
                if (onIdChange) {
                    onIdChange(data.conversation);
                }
            }
        }
    });

    return null;
}
