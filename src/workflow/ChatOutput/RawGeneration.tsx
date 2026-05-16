import { useEffect, useRef, useState } from 'react';
import ConversationDisplay from '../../components/ConversationDisplay/ConversationDisplay';
import style from './style.module.css';
import { Conversation } from '@genai-fi/nanogpt';
import { useAtom, useAtomValue } from 'jotai';
import { rawGeneratorAtom, generatorSettings } from '../../state/generator';
import { modelAtom } from '../../state/model';
import useModelStatus from '../../hooks/useModelStatus';
import { trainerSettings } from '../../state/trainer';
import logger from '../../utilities/logger';
import { Notice } from '../../components/BoxTitle/BoxNotice';
import { wait } from '../../utilities/wait';
import { useTranslation } from 'react-i18next';
import ChatMenu from './ChatMenu';
import { useNavigate } from 'react-router-dom';
import { conversationDataAtom } from '../../state/data';
import { useWorkflowContext } from '@genai-fi/base';
import { createGenerator } from '../../utilities/generatorFactory';

export default function RawGeneration() {
    const { t } = useTranslation();
    const model = useAtomValue(modelAtom);
    const [generator, setGenerator] = useAtom(rawGeneratorAtom);
    const [text, setText] = useState<Conversation[]>([]);
    const status = useModelStatus(model ?? undefined);
    const outputText = useAtomValue(trainerSettings).outputText;
    const [messages, setMessage] = useState<Notice | null>(null);
    const { topP } = useAtomValue(generatorSettings);
    const navigate = useNavigate();
    const conversations = useAtomValue(conversationDataAtom);
    const workflowContext = useWorkflowContext();
    const ref = useRef<HTMLDivElement>(null);
    const convoRef = useRef<Conversation[]>([]);
    const animationFrameRef = useRef<number>(-1);

    useEffect(() => {
        if (ref.current) {
            const remove = workflowContext.registerElement('chatOutput', ref.current);
            return () => {
                remove?.();
            };
        }
    }, [workflowContext]);

    const ready = status !== 'loading';

    useEffect(() => {
        if (ready && model) {
            const generator = createGenerator(model);
            setGenerator(generator);
            setText([]);

            const state = {
                count: 0,
            };

            if (outputText) {
                const h = async () => {
                    state.count++;
                    if (state.count % 2 !== 0) return;
                    try {
                        if (conversations?.length === 0) {
                            const finalText = await generator.generate({
                                nonConversational: true,
                                maxLength: 200,
                                temperature: 0.8,
                                includeProbabilities: false,
                                topP: topP > 0 ? topP : undefined,
                            });
                            setText([...finalText]);
                            logger.log({ action: 'auto_generated_text', text: finalText });
                        } else {
                            const randomIndex = Math.floor(Math.random() * conversations.length);
                            const conversation = conversations[randomIndex];
                            generator.reset();
                            const finalText = await generator.generate([conversation[0]], {
                                maxLength: 200,
                                nonConversational: true,
                                temperature: 0.8,
                                includeProbabilities: false,
                                topP: topP > 0 ? topP : undefined,
                            });

                            setText([...finalText]);
                            logger.log({ action: 'auto_generated_text', text: finalText });
                        }
                    } catch {
                        setMessage({
                            level: 'error',
                            notice: t('generator.errors.generationError'),
                        });
                    }

                    await wait(10);
                };
                model.on('trainStep', h);
                return () => {
                    model.off('trainStep', h);
                };
            }
        }
    }, [model, ready, outputText, topP, setGenerator, t, conversations]);

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
                    //setHasGenerated(false);
                }}
                onShowSettings={() => {
                    navigate('generator-settings');
                }}
            />
            <ConversationDisplay
                conversation={
                    messages ? [...text, { role: 'status', content: messages.notice, level: messages.level }] : text
                }
            />
        </div>
    );
}
