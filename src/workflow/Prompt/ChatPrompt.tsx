import { useAtomValue } from 'jotai';
import style from './style.module.css';
import { conversationGeneratorAtom, generatorSettings } from '../../state/generator';
import { useEffect, useRef, useState } from 'react';
import BoxNotice, { Notice } from '../../components/BoxTitle/BoxNotice';
import { useTranslation } from 'react-i18next';
import useModelStatus from '../../hooks/useModelStatus';
import { modelAtom } from '../../state/model';
import ChatPromptInput from '../../components/ChatPromptInput/ChatPromptInput';
import { useWorkflowContext } from '@genai-fi/base';

export default function ChatPrompt() {
    const { t } = useTranslation();
    const generator = useAtomValue(conversationGeneratorAtom);
    const [generate, setGenerate] = useState(false);
    const [, setHasGenerated] = useState(false);
    const { temperature, topP, maxLength, showAttention, showProbabilities } = useAtomValue(generatorSettings);
    const [messages, setMessage] = useState<Notice | null>(null);
    const busyRef = useRef<boolean>(false);
    const model = useAtomValue(modelAtom);
    const status = useModelStatus(model ?? undefined);
    const workflowContext = useWorkflowContext();
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (ref.current) {
            const remove = workflowContext.registerElement('promptWithInput', ref.current);
            return () => {
                remove?.();
            };
        }
    }, [workflowContext]);

    const disable = status === 'training';

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
            text.push({ role: 'user', content: prompt ?? '' });
        }

        const options = {
            maxLength,
            temperature,
            attentionScores: showAttention,
            includeProbabilities: showProbabilities,
            topP: topP > 0 ? topP : undefined,
            noCache: false,
            nonConversational: false,
        };

        const filteredText = text.filter((part) => part.content.trim().length > 0);

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
            className={style.container}
            data-widget="promptWithInput"
            data-testid="textgenerator"
            ref={ref}
        >
            <ChatPromptInput
                onSend={(prompt) => doGenerate(maxLength, prompt)}
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
