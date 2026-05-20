import { useEffect, useRef, useState } from 'react';
import ConversationDisplay from '../../components/ConversationDisplay/ConversationDisplay';
import style from './style.module.css';
import { Conversation } from '@genai-fi/nanogpt';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { generatorSettings, rawGeneratorAtom } from '../../state/generator';
import { modelAtom } from '../../state/model';
import useModelStatus from '../../hooks/useModelStatus';
import ChatMenu from './ChatMenu';
import { useNavigate } from 'react-router-dom';
import { conversationDataAtom } from '../../state/data';

export default function ChatConversation() {
    const model = useAtomValue(modelAtom);
    const [generator, setGenerator] = useAtom(rawGeneratorAtom);
    const setConversationLog = useSetAtom(conversationDataAtom);
    const [text, setText] = useState<Conversation[]>([]);
    const status = useModelStatus(model ?? undefined);
    const navigate = useNavigate();
    const ref = useRef<HTMLDivElement>(null);
    const convoRef = useRef<Conversation[]>([]);
    const animationFrameRef = useRef<number>(-1);
    const { temperature, topP, maxLength, showAttention, showProbabilities } = useAtomValue(generatorSettings);

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

            const onEnd = () => {
                setConversationLog((prev) => {
                    const convo = generator.getConversation();
                    if (prev.includes(convo)) {
                        return [...prev];
                    }
                    return [...prev, convo];
                });
            };
            generator.on('stop', onEnd);
            return () => {
                generator.off('tokens', h);
                generator.off('stop', onEnd);
                generator.dispose();
                if (animationFrameRef.current !== -1) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
            };
        }
    }, [generator, setConversationLog]);

    const doRetry = async (index: number) => {
        if (!generator || (status !== 'ready' && status !== 'busy' && status !== 'awaitingTokens')) {
            return;
        }

        const text = generator.getConversation().slice(0, index + 1);
        generator.reset();

        const options = {
            maxLength,
            temperature,
            attentionScores: showAttention,
            includeProbabilities: showProbabilities,
            topP: topP > 0 ? topP : undefined,
            noCache: false,
            nonConversational: false,
        };

        try {
            await generator.generate(text, options);
        } catch (e) {
            console.error('Generation error:', e);
            // ignore
        }
    };

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
            <ConversationDisplay
                conversation={text}
                onRetry={doRetry}
            />
        </div>
    );
}
