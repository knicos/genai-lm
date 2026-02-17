import { usePeerData } from '@genai-fi/base/hooks/peer';
import { EventProtocol } from './events';
import { Connection } from '@genai-fi/base';
import { useAtomValue } from 'jotai';
import { modelAtom } from '../../state/model';
import { v4 as uuidv4 } from 'uuid';

export default function ChatProtocol() {
    //const code = useAtomValue(sessionCode);
    const model = useAtomValue(modelAtom);

    usePeerData(async (data: EventProtocol, conn: Connection<EventProtocol>) => {
        if (data.event === 'chat') {
            if (model && model.loaded) {
                const generator = model.generator();
                const conversationId = data.conversation || uuidv4();
                if (data.stream) {
                    let step = 0;
                    generator.on('tokens', () => {
                        step++;
                        if (step % 5 !== 0) return;
                        const convo = generator.getConversation();
                        const lastMessage = convo[convo.length - 1];
                        conn.send({
                            event: 'response',
                            output: lastMessage,
                            completed: false,
                            conversation: conversationId,
                        });
                    });
                }
                generator
                    .generate(Array.isArray(data.input) ? data.input : [{ role: 'user', content: data.input }], {
                        maxLength: 1000,
                        topP: 0.9,
                        temperature: 0.8,
                    })
                    .then((response) => {
                        conn.send({
                            event: 'response',
                            output: response[response.length - 1],
                            completed: true,
                            conversation: conversationId,
                        });
                        generator.dispose();
                    });
            } else {
                console.warn('Model not ready, cannot generate response');
                conn.send({ event: 'error', message: 'Model not ready' });
            }
        }
    });

    return null;
}
