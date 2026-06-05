import { useEffect, useRef, useState } from 'react';
import ConversationDisplay from '../../components/ConversationDisplay/ConversationDisplay';
import style from './style.module.css';
import { Conversation } from '@genai-fi/nanogpt';
import { useAtom, useAtomValue } from 'jotai';
import { conversationGeneratorAtom } from '../../state/generator';
import { loadedModelAtom } from '../../state/model';
import ChatMenu from './ChatMenu';
import { useNavigate } from 'react-router-dom';

export default function ChatConversation() {
    const model = useAtomValue(loadedModelAtom);
    const [generator, setGenerator] = useAtom(conversationGeneratorAtom);
    const [text, setText] = useState<Conversation[]>([]);
    const navigate = useNavigate();
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (model) {
            const generator = model.generator();
            setGenerator(generator);
            setText([]);
        }
    }, [model, setGenerator]);

    useEffect(() => {
        if (generator) {
            const h = () => {
                const convo = generator.getConversation().slice();
                setText(convo);
            };
            generator.on('tokens', h);
            h();
            return () => {
                generator.off('tokens', h);
                generator.dispose();
            };
        }
    }, [generator]);

    return (
        <div
            className={style.container}
            data-widget="chat-output"
            data-testid="conversation-output"
            ref={ref}
        >
            <ChatMenu
                onReset={() => {
                    if (generator) {
                        generator.stop();
                        generator.reset();
                    }
                    setText([]);
                }}
                onShowSettings={() => {
                    navigate('generator-settings');
                }}
            />
            <ConversationDisplay conversation={text} />
        </div>
    );
}
