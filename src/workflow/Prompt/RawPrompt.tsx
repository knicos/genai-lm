import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import style from './style.module.css';
import { generatorSettings, rawGeneratedTextAtom, rawGenerationIDAtom } from '../../state/generator';
import { useRef, useState, useEffect } from 'react';
import BoxNotice, { Notice } from '../../components/BoxTitle/BoxNotice';
import { useTranslation } from 'react-i18next';
import useModelStatus from '../../hooks/useModelStatus';
import { loadedModelAtom } from '../../state/model';
import ChatPromptInput from '../../components/ChatPromptInput/ChatPromptInput';
import { trainerJobIdAtom, trainerSettings } from '../../state/trainer';
import { GeneratorConversation, IGenerateOptions, IGeneratorResponse } from '@genai-fi/nanogpt';
import { conversationDataAtom } from '../../state/data';

export default function ChatPrompt() {
    const { t } = useTranslation();
    const [output, setOutput] = useAtom(rawGeneratedTextAtom);
    const [id, setID] = useAtom(rawGenerationIDAtom);
    const trainerJobId = useAtomValue(trainerJobIdAtom);
    const [generate, setGenerate] = useState(false);
    //const [hasGenerated, setHasGenerated] = useState(false);
    const settings = useAtomValue(generatorSettings);
    const [messages, setMessage] = useState<Notice | null>(null);
    const busyRef = useRef<string | null>(null);
    const model = useAtomValue(loadedModelAtom);
    const status = useModelStatus(model ?? undefined);
    const ref = useRef<HTMLDivElement>(null);
    const outputText = useAtomValue(trainerSettings).outputText;
    const promptRef = useRef<string>('');
    const setConversationLog = useSetAtom(conversationDataAtom);

    const disable = status === 'training';

    const hasGenerated = output.length > 0;

    /*useEffect(() => {
        if (model) {
            setHasGenerated(generator.getConversation().length > 0);
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

            return () => {
                generator.off('reset', onReset);
                generator.off('start', onStart);
            };
        } else {
            setHasGenerated(false);
        }
    }, [generator, model, topP, outputText, promptMode]);*/

    useEffect(() => {
        if (trainerJobId && outputText && model) {
            const state = {
                count: 0,
            };

            model.training.breakpoints(trainerJobId, true);

            const h = async () => {
                //if (id !== trainerJobId) return;
                state.count++;
                if (state.count % 2 !== 0) {
                    setTimeout(() => model.training.resume(trainerJobId), 10);
                    return;
                }
                try {
                    if (promptRef.current.length > 0) {
                        const response = await model.responses.create({
                            input: [{ role: 'assistant', content: promptRef.current }],
                            nonConversational: true,
                            continuation: true,
                            maxLength: 200,
                            temperature: 0.8,
                            topP: 0.9,
                            outputScore: true,
                            outputConfidence: true,
                        });

                        setOutput((prev) => [...prev, ...response.output]);
                        //setHasGenerated(true);
                    } else {
                        const isConversational = model?.meta.mode === 'conversational';
                        const response = await model.responses.create({
                            nonConversational: !isConversational,
                            maxLength: 200,
                            temperature: 0.8,
                            topP: 0.9,
                            outputScore: true,
                            outputConfidence: true,
                        });

                        if (response.output.length > 0) {
                            const job = model.training.getJob(trainerJobId);
                            const step = job ? job.history?.[job.history.length - 1].step : null;
                            if (step !== null) {
                                response.output[0]._step = step;
                            }
                            response.output[0]._trainingOutput = true;
                            response.output[0]._timestamp = Date.now();
                        }

                        setOutput((prev) => [...prev, ...response.output]);
                        //setHasGenerated(true);
                    }
                } catch (e) {
                    console.error('Auto-generation error', e);
                }

                //await wait(10);
                model.training.resume(trainerJobId);
            };
            model.training.on('progress', h);
            return () => {
                model.training.off('progress', h);
            };
        } else if (model && trainerJobId) {
            model.training.breakpoints(trainerJobId, false);
        }
    }, [trainerJobId, outputText, model, setOutput]);

    const doGenerate = async (maxLength: number, prompt?: string) => {
        if (!model || (status !== 'ready' && status !== 'busy' && status !== 'awaitingTokens')) {
            setMessage({
                level: 'warning',
                notice: t('generator.errors.modelNotReady'),
            });
            return;
        }
        if (busyRef.current) {
            model.responses.cancel(busyRef.current);
            return;
        }
        if (maxLength > 1) setGenerate(true);
        //setHasGenerated(true);

        const text: GeneratorConversation[] = [];

        const promptMode = settings.promptMode;

        if (prompt && prompt.length > 0) {
            text.push({ role: promptMode === 'conversation' ? 'user' : 'text', content: prompt ?? '' });
        }

        const filteredText = promptMode === 'none' ? [] : text.filter((part) => part.content.trim().length > 0);

        const options: IGenerateOptions = {
            ...settings,
            noCache: false,
            nonConversational: promptMode !== 'conversation',
            continuation: !!prompt && prompt.length > 0 && promptMode === 'completion',
            input: filteredText.length > 0 ? filteredText : undefined,
            background: true,
            previous_response_id: id ?? undefined,
        };

        const doneHandler = (id: string) => {
            if (busyRef.current === id) {
                busyRef.current = null;
                setGenerate(false);
                model.responses.off('done', doneHandler);

                setConversationLog(async (prev) => {
                    const convo = model.responses.getResponse(id)?.output ?? [];
                    const data = await prev;
                    if (data.includes(convo)) {
                        return [...data];
                    }
                    return [...data, convo];
                });
            }
        };

        const convoRef = { current: [] as GeneratorConversation[] };
        const animationFrameRef = { current: -1 };

        const h = (output: IGeneratorResponse) => {
            const convo = output.output ?? [];
            //setText(convo);
            convoRef.current = convo;

            if (animationFrameRef.current === -1) {
                animationFrameRef.current = requestAnimationFrame(() => {
                    setOutput(convoRef.current.slice());

                    animationFrameRef.current = -1;
                });
            }
        };

        try {
            model.responses.on('done', doneHandler);
            const response = await model.responses.create(options, h);
            busyRef.current = response.id;
            setID(response.id);
        } catch {
            setMessage({
                level: 'error',
                notice: t('generator.errors.generationError'),
            });
            setGenerate(false);
            busyRef.current = null;
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
                onSend={(prompt) => {
                    promptRef.current = '';
                    doGenerate(settings.maxLength ?? 1, prompt);
                }}
                onChange={(value) => {
                    promptRef.current = value;
                }}
                disabled={disable}
                generating={generate}
                onStop={() => model && busyRef.current && model.responses.cancel(busyRef.current)}
                noPrompt={settings.promptMode === 'none'}
                placeholder={t('deploy.placeholder')}
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
