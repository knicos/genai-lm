import { useAtomValue } from 'jotai';
import style from './style.module.css';
import { generatorSettings, rawGeneratorAtom } from '../../state/generator';
import { useEffect, useRef, useState } from 'react';
import BoxNotice, { Notice } from '../../components/BoxTitle/BoxNotice';
import { useTranslation } from 'react-i18next';
import useModelStatus from '../../hooks/useModelStatus';
import { modelAtom } from '../../state/model';
import ChatPromptInput from '../../components/ChatPromptInput/ChatPromptInput';
import { trainerSettings } from '../../state/trainer';

export default function ChatPrompt() {
    const { t } = useTranslation();
    const generator = useAtomValue(rawGeneratorAtom);
    const [generate, setGenerate] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);
    const { temperature, topP, maxLength, showAttention, showProbabilities, promptMode } =
        useAtomValue(generatorSettings);
    const [messages, setMessage] = useState<Notice | null>(null);
    const busyRef = useRef<boolean>(false);
    const model = useAtomValue(modelAtom);
    const status = useModelStatus(model ?? undefined);
    const ref = useRef<HTMLDivElement>(null);
    const outputText = useAtomValue(trainerSettings).outputText;
    const promptRef = useRef<string>('');

    const disable = status === 'training';

    useEffect(() => {
        setHasGenerated(false);
        if (model && generator) {
            const onReset = () => {
                setHasGenerated(false);
            };
            generator.on('reset', onReset);

            const onStart = () => {
                setHasGenerated(true);
                setGenerate(true);
            };
            generator.on('start', onStart);

            const onStop = () => {
                setGenerate(false);
                //busyRef.current = false;
            };
            generator.on('stop', onStop);

            const state = {
                count: 0,
            };

            if (outputText) {
                const h = async () => {
                    state.count++;
                    if (state.count % 2 !== 0) return;
                    try {
                        if (promptRef.current.length > 0 && promptMode === 'completion') {
                            await generator.generate([{ role: 'assistant', content: promptRef.current }], {
                                nonConversational: true,
                                continuation: true,
                                maxLength: 200,
                                temperature: 0.8,
                                includeProbabilities: false,
                                topP: topP > 0 ? topP : undefined,
                            });
                        } else {
                            await generator.generate({
                                nonConversational: true,
                                maxLength: 200,
                                temperature: 0.8,
                                includeProbabilities: false,
                                topP: topP > 0 ? topP : undefined,
                            });
                        }
                    } catch {
                        console.error('Auto-generation error');
                    }

                    //await wait(10);
                };
                model.on('trainStep', h);
                return () => {
                    model.off('trainStep', h);
                };
            }

            return () => {
                generator.off('reset', onReset);
                generator.off('start', onStart);
            };
        }
    }, [generator, model, topP, outputText, promptMode]);

    const doGenerate = async (maxLength: number, prompt?: string) => {
        if (!generator || (status !== 'ready' && status !== 'busy' && status !== 'awaitingTokens')) {
            setMessage({
                level: 'warning',
                notice: t('generator.errors.modelNotReady'),
            });
            return;
        }
        if (busyRef.current) {
            generator.stop();
            return;
        }
        busyRef.current = true;
        if (maxLength > 1) setGenerate(true);
        setHasGenerated(true);

        const text = generator.getConversation();

        //const currentText = generator.getConversation();

        if (prompt && prompt.length > 0) {
            text.push({ role: promptMode === 'conversation' ? 'user' : 'assistant', content: prompt ?? '' });
        }

        const options = {
            maxLength,
            temperature,
            attentionScores: showAttention,
            includeProbabilities: showProbabilities,
            topP: topP > 0 ? topP : undefined,
            noCache: false,
            nonConversational: promptMode !== 'conversation',
            continuation: promptMode === 'completion',
        };

        const filteredText = promptMode === 'none' ? [] : text.filter((part) => part.content.trim().length > 0);

        try {
            if (filteredText.length === 0) {
                await generator.generate(options);
            } else {
                await generator.generate(filteredText, options);
            }

            setGenerate(false);
            busyRef.current = false;
        } catch {
            setMessage({
                level: 'error',
                notice: t('generator.errors.generationError'),
            });
            setGenerate(false);
            busyRef.current = false;
        }
    };

    return (
        <div
            className={`${style.container} ${!hasGenerated ? style.start : ''}`}
            data-testid="rawtextgenerator"
            ref={ref}
        >
            {!hasGenerated && <h2>{t('generator.startPrompt')}</h2>}
            <ChatPromptInput
                onSend={(prompt) => doGenerate(maxLength, prompt)}
                onChange={(value) => {
                    promptRef.current = value;
                }}
                disabled={disable}
                generating={generate}
                onStop={() => generator?.stop()}
            />
            {messages && (
                <BoxNotice
                    notice={messages}
                    onClose={() => setMessage(null)}
                />
            )}
        </div>
    );
}
