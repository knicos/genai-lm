import { useAtomValue, useSetAtom } from 'jotai';
import style from './style.module.css';
import { conversationGeneratedAtom, generatorSettings } from '../../state/generator';
import { useRef, useState } from 'react';
import BoxNotice, { Notice } from '../../components/BoxTitle/BoxNotice';
import { useTranslation } from 'react-i18next';
import useModelStatus from '../../hooks/useModelStatus';
import { loadedModelAtom, modelLoRAName } from '../../state/model';
import ChatPromptInput from '../../components/ChatPromptInput/ChatPromptInput';
import { GeneratorConversation, IGenerateOptions, IGeneratorResponse } from '@genai-fi/nanogpt';

export default function ChatPrompt() {
    const { t } = useTranslation();
    const setOutput = useSetAtom(conversationGeneratedAtom);
    const [generate, setGenerate] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);
    const settings = useAtomValue(generatorSettings);
    const [messages, setMessage] = useState<Notice | null>(null);
    const busyRef = useRef<string | null>(null);
    const model = useAtomValue(loadedModelAtom);
    const status = useModelStatus(model ?? undefined);
    const ref = useRef<HTMLDivElement>(null);
    const loraName = useAtomValue(modelLoRAName);

    const disable = status === 'training';

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
        setHasGenerated(true);

        const text: GeneratorConversation[] = [];

        //const currentText = generator.getConversation();

        if (prompt && prompt.length > 0) {
            text.push({ role: 'user', content: prompt ?? '' });
        }

        const filteredText = text.filter((part) => part.content.trim().length > 0);

        const options: IGenerateOptions = {
            ...settings,
            maxLength: model?.config.blockSize
                ? Math.min(settings.maxLength ?? 0, model.config.blockSize * 4)
                : maxLength,
            noCache: false,
            nonConversational: false,
            loraName: loraName ?? undefined,
            input: filteredText.length === 0 ? undefined : filteredText,
            background: true,
        };

        const doneHandler = (id: string) => {
            if (busyRef.current === id) {
                busyRef.current = null;
                setGenerate(false);
                model.responses.off('done', doneHandler);
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
            data-widget="promptWithInput"
            data-testid="textgenerator"
            ref={ref}
        >
            {!hasGenerated && <h2>{t('generator.startChatPrompt')}</h2>}
            <ChatPromptInput
                onSend={(prompt) => doGenerate(settings.maxLength ?? 1, prompt)}
                disabled={disable}
                generating={generate}
                onStop={() => model && busyRef.current && model.responses.cancel(busyRef.current)}
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
