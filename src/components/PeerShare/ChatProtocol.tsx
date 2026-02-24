import { usePeerData } from '@genai-fi/base/hooks/peer';
import { EventProtocol } from './events';
import { Connection } from '@genai-fi/base';
import { useAtomValue } from 'jotai';
import { modelAtom } from '../../state/model';
import { v4 as uuidv4 } from 'uuid';
import { useEffect, useState } from 'react';
import ChatManager from './ChatManager';

export default function ChatProtocol() {
    //const code = useAtomValue(sessionCode);
    const model = useAtomValue(modelAtom);
    const [manager, setManager] = useState<ChatManager | null>(null);

    useEffect(() => {
        if (model) {
            setManager((old) => {
                if (old) {
                    old.stopAll();
                }
                return new ChatManager(model);
            });
        }
    }, [model]);

    usePeerData(async (data: EventProtocol, conn: Connection<EventProtocol>) => {
        if (data.event === 'chat') {
            if (manager) {
                const conversationId = data.conversation || uuidv4();

                manager.startConversation(
                    conversationId,
                    data.input,
                    (id, message, completed) => {
                        if (data.stream || completed) {
                            conn.send({
                                event: 'response',
                                output: { role: 'assistant', content: message },
                                completed,
                                conversation: id,
                            });
                        }
                    },
                    (_, error) => {
                        conn.send({ event: 'error', message: error });
                    }
                );
            } else {
                console.warn('Model not ready, cannot generate response');
                conn.send({ event: 'error', message: 'Model not ready' });
            }
        } else if (data.event === 'stop') {
            if (manager) {
                manager.stopConversation(data.conversation);
            }
        }
    });

    return null;
}
