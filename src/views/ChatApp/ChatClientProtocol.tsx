import { usePeerData, usePeerSender } from '@genai-fi/base/hooks/peer';
import { EventProtocol } from '../../components/PeerShare/events';
import { Conversation } from '@genai-fi/nanogpt';
import { useEffect, useRef } from 'react';

interface Props {
    loRA?: string;
    conversation: Conversation[];
    onResponse: (response: string, completed: boolean) => void;
    onIdChange?: (id: string) => void;
}

export default function ChatClientProtocol({ loRA, conversation, onResponse, onIdChange }: Props) {
    const id = useRef<string | null>(null);
    const lastLength = useRef(0);
    const send = usePeerSender<EventProtocol>();

    useEffect(() => {
        if (conversation.length > 0 && conversation[conversation.length - 1].role === 'user') {
            if (conversation.length < lastLength.current) {
                id.current = null;
            }
            const newMessages = conversation.slice(lastLength.current);
            send({ event: 'chat', conversation: id.current ?? undefined, input: newMessages, stream: true, loRA });
        }
        lastLength.current = conversation.length;
    }, [conversation, send, loRA]);

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
