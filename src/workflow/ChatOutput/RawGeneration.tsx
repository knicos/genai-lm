import { useEffect, useRef } from 'react';
import ConversationDisplay from '../../components/ConversationDisplay/ConversationDisplay';
import style from './style.module.css';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { generatorSettings } from '../../state/generator';
import { useState } from 'react';
import { rawGeneratedTextAtom, rawGenerationIDAtom } from '../../state/generator';
import { loadedModelAtom } from '../../state/model';
import useModelStatus from '../../hooks/useModelStatus';
import ChatMenu from './ChatMenu';
import { useNavigate } from 'react-router';

export default function RawGeneration() {
    const model = useAtomValue(loadedModelAtom);
    const [output, setOutput] = useAtom(rawGeneratedTextAtom);
    const setID = useSetAtom(rawGenerationIDAtom);
    const status = useModelStatus(model ?? undefined);
    const navigate = useNavigate();
    const ref = useRef<HTMLDivElement>(null);
    const responseId = useAtomValue(rawGenerationIDAtom);
    const [highlightMode, setHighlightMode] = useState<'none' | 'confidence' | 'score'>('none');
    const setSettings = useSetAtom(generatorSettings);

    useEffect(() => {
        if (model) {
            setOutput([]);
        }
    }, [model, setOutput]);

    useEffect(() => {
        setSettings((old) => ({
            ...old,
            outputConfidence: true,
            outputScore: true,
        }));
        return () => {
            setOutput([]);
            setID(null);
        };
    }, [setSettings, setOutput, setID]);

    const doRetry = async (index: number) => {
        if (!model || (status !== 'ready' && status !== 'busy' && status !== 'awaitingTokens')) {
            return;
        }
        if (!responseId) {
            return;
        }

        model.responses.retry(responseId, index);
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
                    setOutput([]);
                    setID(null);
                }}
                onShowSettings={() => {
                    navigate('generator-settings');
                }}
                onConfidence={() => {
                    setHighlightMode((prev) => (prev !== 'confidence' ? 'confidence' : 'none'));
                }}
                onScore={() => {
                    setHighlightMode((prev) => (prev !== 'score' ? 'score' : 'none'));
                }}
                highlightMode={highlightMode}
            />
            <ConversationDisplay
                conversation={output}
                onRetry={doRetry}
                highlightMode={highlightMode}
            />
        </div>
    );
}
