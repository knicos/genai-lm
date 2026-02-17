import { useAtomValue } from 'jotai';
import style from './style.module.css';
import { generatorAtom, generatorSettings } from '../../state/generator';
import { useRef, useState } from 'react';
import BoxNotice, { Notice } from '../../components/BoxTitle/BoxNotice';
import { useTranslation } from 'react-i18next';
import useModelStatus from '../../utilities/useModelStatus';
import { modelAtom } from '../../state/model';
import ChatPromptInput from '../../components/ChatPromptInput/ChatPromptInput';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import StopIcon from '@mui/icons-material/Stop';
import { Button } from '@genai-fi/base';

interface Props {
    showPromptInput?: boolean;
}

export default function Prompt({ showPromptInput }: Props) {
    const { t } = useTranslation();
    const generator = useAtomValue(generatorAtom);
    const [generate, setGenerate] = useState(false);
    const [, setHasGenerated] = useState(false);
    const { temperature, topP, maxLength, showAttention, showProbabilities, showPrompt } =
        useAtomValue(generatorSettings);
    const [messages, setMessage] = useState<Notice | null>(null);
    const busyRef = useRef<boolean>(false);
    const model = useAtomValue(modelAtom);
    const status = useModelStatus(model ?? undefined);

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
            nonConversational: !showPromptInput && !showPrompt,
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
            data-widget="prompt"
            data-testid="textgenerator"
        >
            {showPromptInput && (
                <ChatPromptInput
                    onSend={(prompt) => doGenerate(maxLength, prompt)}
                    disabled={disable}
                    generating={generate}
                    onStop={() => generator?.stop()}
                />
            )}
            {!showPromptInput && (
                <Button
                    className={style.generateButton}
                    onClick={() => doGenerate(maxLength)}
                    startIcon={generate ? <StopIcon /> : <ArrowUpwardIcon />}
                    fullWidth
                    variant="contained"
                    color="primary"
                    disabled={disable}
                >
                    {generate ? t('generator.stop') : t('generator.generate')}
                </Button>
            )}
            {messages && (
                <BoxNotice
                    notice={messages}
                    onClose={() => setMessage(null)}
                />
            )}
        </div>
    );
}
