import { useAtomValue } from 'jotai';
import Controls from './Controls';
import style from './style.module.css';
import { generatorAtom, generatorSettings } from '../../state/generator';
import { useRef, useState } from 'react';
import BoxNotice, { Notice } from '../../components/BoxTitle/BoxNotice';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import useModelStatus from '../../utilities/useModelStatus';
import { modelAtom } from '../../state/model';

export default function Prompt() {
    const { t } = useTranslation();
    const generator = useAtomValue(generatorAtom);
    const [generate, setGenerate] = useState(false);
    const [, setHasGenerated] = useState(false);
    const { temperature, topP, maxLength, showAttention, showProbabilities, showSettings, showPrompt } =
        useAtomValue(generatorSettings);
    const [autoMode, setAutoMode] = useState<boolean>(true);
    const [messages, setMessage] = useState<Notice | null>(null);
    const navigate = useNavigate();
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

        //if (prompt && prompt.length > 0) {
        text.push({ role: 'user', content: prompt ?? '' });
        //}

        const options = {
            maxLength,
            temperature,
            attentionScores: showAttention,
            includeProbabilities: showProbabilities,
            topP: topP > 0 ? topP : undefined,
            noCache: false,
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
            <Controls
                prompt={showPrompt}
                onGenerate={(prompt) => doGenerate(autoMode ? maxLength : 1, prompt)}
                disable={disable}
                generate={generate}
                onReset={() => {
                    if (generate && generator) {
                        generator.stop();
                    }
                    generator?.reset();
                    setHasGenerated(false);
                }}
                onShowSettings={() => {
                    navigate('generator-settings');
                }}
                enableSettings={showSettings}
                autoMode={autoMode}
                onAutoModeChange={setAutoMode}
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
