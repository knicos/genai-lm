import { useEffect, useRef, useState } from 'react';
import ConversationDisplay from '../../components/ConversationDisplay/ConversationDisplay';
import style from './style.module.css';
import { Conversation } from '@genai-fi/nanogpt';
import { useAtom, useAtomValue } from 'jotai';
import { rawGeneratorAtom } from '../../state/generator';
import { modelAtom } from '../../state/model';
import useModelStatus from '../../hooks/useModelStatus';
import ChatMenu from './ChatMenu';
import { useNavigate } from 'react-router-dom';

export default function ChatConversation() {
    const model = useAtomValue(modelAtom);
    const [generator, setGenerator] = useAtom(rawGeneratorAtom);
    const [text, setText] = useState<Conversation[]>([]);
    const status = useModelStatus(model ?? undefined);
    const navigate = useNavigate();
    const ref = useRef<HTMLDivElement>(null);
    const convoRef = useRef<Conversation[]>([]);
    const animationFrameRef = useRef<number>(-1);

    const ready = status !== 'loading';

    useEffect(() => {
        if (ready && model) {
            const generator = model.generator();
            setGenerator(generator);
            setText([]);
        }
    }, [model, ready, setGenerator]);

    useEffect(() => {
        if (generator) {
            const h = () => {
                const convo = generator.getConversation();
                //setText(convo);
                convoRef.current = convo;
                if (animationFrameRef.current === -1) {
                    animationFrameRef.current = requestAnimationFrame(() => {
                        setText(convoRef.current.slice());
                        animationFrameRef.current = -1;
                    });
                }
            };
            generator.on('tokens', h);
            h();
            return () => {
                generator.off('tokens', h);
                generator.dispose();
                if (animationFrameRef.current !== -1) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
            };
        }
    }, [generator]);

    return (
        <div
            className={style.container}
            data-widget="chat-output"
            data-testid="chat-output"
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
