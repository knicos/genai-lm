import { useEffect, useState } from 'react';
import ConversationDisplay from '../../components/ConversationDisplay/ConversationDisplay';
import style from './style.module.css';
import { Conversation } from '@genai-fi/nanogpt';
import { useAtom, useAtomValue } from 'jotai';
import { generatorAtom, generatorSettings } from '../../state/generator';
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

export default function ChatOutput() {
    const { t } = useTranslation();
    const model = useAtomValue(modelAtom);
    const [generator, setGenerator] = useAtom(generatorAtom);
    const [text, setText] = useState<Conversation[]>([]);
    const status = useModelStatus(model ?? undefined);
    const outputText = useAtomValue(trainerSettings).outputText;
    const [messages, setMessage] = useState<Notice | null>(null);
    const { topP } = useAtomValue(generatorSettings);
    const navigate = useNavigate();
    const conversations = useAtomValue(conversationDataAtom);

    const ready = status !== 'loading';

    useEffect(() => {
        if (ready && model) {
            const generator = model.generator();
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
                                maxLength: 200,
                                temperature: 1,
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
                                temperature: 1,
                                includeProbabilities: false,
                                topP: topP > 0 ? topP : undefined,
                            });
                            console.log('Generated text for conversation:', finalText);
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
            data-testid="chat-output"
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
