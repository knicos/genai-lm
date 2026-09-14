import { useCallback, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import { loadedModelAtom } from '../state/model';
import { Notice } from '../components/BoxTitle/BoxNotice';
import { GeneratorConversation, IGenerateOptions, IGeneratorResponse, Conversation } from '@genai-fi/nanogpt';
import { ExtendedGeneratorConversation, GeneratorSettings } from '../state/generator';

export default function useGenerate(setOutput: (output: ExtendedGeneratorConversation[]) => void, id?: string) {
    const [generate, setGenerate] = useState(false);
    const [message, setMessage] = useState<Notice | null>(null);
    const busyRef = useRef<string | null>(null);
    const model = useAtomValue(loadedModelAtom);

    const doGenerate = useCallback(
        async (settings: GeneratorSettings, prompt?: string | Conversation[]): Promise<string | null> => {
            if (!model) {
                setMessage({
                    level: 'warning',
                    notice: 'generator.errors.modelNotReady',
                });
                return null;
            }
            if (busyRef.current) {
                model.responses.cancel(busyRef.current);
                return null;
            }
            if ((settings.maxLength ?? 1000) > 1) setGenerate(true);
            //setHasGenerated(true);

            const text: GeneratorConversation[] = Array.isArray(prompt) ? prompt : [];

            const promptMode = settings.promptMode;

            if (prompt && prompt.length > 0 && typeof prompt === 'string') {
                text.push({ role: promptMode === 'conversation' ? 'user' : 'text', content: prompt ?? '' });
            }

            const options: IGenerateOptions = {
                ...settings,
                noCache: false,
                nonConversational: promptMode !== 'conversation',
                //continuation: !!prompt && prompt.length > 0 && promptMode === 'completion',
                input: text.length > 0 ? text : undefined,
                background: true,
                previous_response_id: id ?? undefined,
            };

            const doneHandler = (id: string) => {
                if (busyRef.current === id) {
                    busyRef.current = null;
                    setGenerate(false);
                    model.responses.off('done', doneHandler);
                }
            };

            const convoRef = { current: [] as ExtendedGeneratorConversation[] };
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
                return response.id;
            } catch {
                setMessage({
                    level: 'error',
                    notice: 'generator.errors.generationError',
                });
                setGenerate(false);
                busyRef.current = null;
                return null;
            }
        },
        [model, id, setOutput]
    );

    return {
        generate: doGenerate,
        generating: generate,
        message,
    };
}
