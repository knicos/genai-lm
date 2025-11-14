import style from './style.module.css';
import { useEffect, useRef, useState } from 'react';
import { CharTokeniser, TeachableLLM } from '@genai-fi/nanogpt';
import TextHighlighter, { ProbabilityItem } from '../../components/TextHighlighter/TextHighlighter';
import useModelStatus from '../../utilities/useModelStatus';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import { useTranslation } from 'react-i18next';
import XAIView from './XAIView';
import GeneratorSettings from './GeneratorSettings';
import { wait } from '../../utilities/wait';
import { useAtomValue } from 'jotai';
import {
    generatorAttentionBlock,
    generatorMaxLength,
    generatorShowAttention,
    generatorShowProbabilities,
    generatorShowSettings,
    generatorTemperature,
    generatorTopP,
} from '../../state/generatorSettings';
import ModelStatus from '../../components/ModelStatus/ModelStatus';
import Box from '../../components/BoxTitle/Box';
import { trainerOutputText } from '../../state/trainerSettings';
import Controls from './Controls';

interface Props {
    model?: TeachableLLM;
}

function createProbabilitiesForHead(
    attentionData: number[][][][][],
    offset: number,
    index: number,
    layer: number,
    head: number
): ProbabilityItem[] {
    if (index < 0 || layer < 0 || head < 0) return [];
    const data = attentionData[index][layer][head][0];
    if (!data) return [];
    const realIndex = Math.min(index + offset - 1, data.length - 1);
    const probabilities = new Array(attentionData.length).fill(0);
    for (let i = 0; i <= realIndex; i++) {
        const idx = index - realIndex + i - 1;
        if (idx >= 0) {
            probabilities[idx] = data[i] || 0;
        }
    }

    // Exaggerate and normalize
    const exaggerated = adaptiveExaggerateAndNormalize(probabilities, 2);
    return probabilities.map((_, i) => ({ index: head, probability: exaggerated[i] }));
}

function adaptiveExaggerateAndNormalize(scores: number[], maxExp: number): number[] {
    if (scores.length === 0) return [];
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;

    // Exaggeration: higher power for lower variance (flatter attention)
    // Clamp exponent between 1.5 and 4 for stability
    const exponent = Math.max(1.5, Math.min(maxExp, maxExp - variance * 6));

    // Apply power scaling
    const exaggerated = scores.map((s) => Math.pow(s, exponent));

    // Normalize so max value is 1
    const maxVal = Math.max(...exaggerated, 1e-8);
    return exaggerated.map((s) => s / maxVal);
}

function createProbabilities(
    attentionData: number[][][][][],
    offset: number,
    index: number,
    layer: number
): ProbabilityItem[] {
    if (index < 0 || layer < 0) return [];
    const headresults: ProbabilityItem[][] = [];
    const numHeads = attentionData[0]?.[0]?.length || 0;
    for (let h = 0; h < numHeads; h++) {
        const headProbabilities = createProbabilitiesForHead(attentionData, offset, index, layer, h);
        headresults.push(headProbabilities);
    }

    const result: ProbabilityItem[] = [];
    for (let i = 0; i < headresults[0]?.length || 0; i++) {
        // Select the maximum head probability for each token
        let maxProb = 0;
        let maxHead = -1;
        for (let h = 0; h < headresults.length; h++) {
            if (headresults[h][i] && headresults[h][i].probability > maxProb) {
                maxProb = headresults[h][i].probability;
                maxHead = headresults[h][i].index;
            }
        }
        result.push({ index: maxHead, probability: maxProb });
    }

    return result;
}

function createTopKTokens(
    probabilities: number[],
    k: number,
    tokeniser: CharTokeniser
): { token: string; probability: number }[] {
    const tokenProbabilities = probabilities.map((prob, idx) => ({
        token: tokeniser.vocab[idx],
        probability: prob,
    }));
    tokenProbabilities.sort((a, b) => b.probability - a.probability);
    return tokenProbabilities.slice(0, k);
}

export default function TextGenerator({ model }: Props) {
    const { t } = useTranslation();
    const [generator, setGenerator] = useState<ReturnType<TeachableLLM['generator']> | undefined>();
    const [text, setText] = useState<string>('');
    const [attentionData, setAttentionData] = useState<number[][][][][]>([]);
    const [probabilities, setProbabilities] = useState<number[][]>([]);
    const [topKTokens, setTopKTokens] = useState<{ token: string; probability: number }[]>([]);
    const [selected, setSelected] = useState<number>(0);
    const status = useModelStatus(model);
    //const [ready, setReady] = useState(false);
    const [generate, setGenerate] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [showSettings, setShowSettings] = useState<boolean>(false);
    const enableSettings = useAtomValue(generatorShowSettings);
    const enableAttention = useAtomValue(generatorShowAttention);
    const attentionBlock = useAtomValue(generatorAttentionBlock);
    const enableProbabilities = useAtomValue(generatorShowProbabilities);
    const temperature = useAtomValue(generatorTemperature);
    const topP = useAtomValue(generatorTopP);
    const maxLength = useAtomValue(generatorMaxLength);
    const outputText = useAtomValue(trainerOutputText);
    const [showStatus, setShowStatus] = useState<boolean>(false);
    const [autoMode, setAutoMode] = useState<boolean>(true);

    const attentionRef = useRef<number[][][][][]>([]);
    const probRef = useRef<number[][]>([]);
    const textRef = useRef<string>('');
    const busyRef = useRef<boolean>(false);

    const disable = status === 'training';
    const ready = status !== 'loading';

    useEffect(() => {
        if (ready) {
            setTopKTokens(createTopKTokens(probabilities[selected] || [], 5, model?.tokeniser as CharTokeniser));
        }
    }, [probabilities, selected, model, ready]);

    useEffect(() => {
        if (ready && model) {
            const generator = model.generator();
            setGenerator(generator);

            setHasGenerated(false);
            setText('');
            textRef.current = '';
            setAttentionData([]);
            attentionRef.current = [];
            setProbabilities([]);
            probRef.current = [];
            setSelected(-1);

            const state = {
                count: 0,
            };

            if (outputText) {
                const h = async () => {
                    state.count++;
                    if (state.count % 2 !== 0) return;
                    setText(''); // Clear previous text
                    setAttentionData([]); // Clear previous attention data
                    textRef.current = '';
                    setGenerate(true);
                    setHasGenerated(true);
                    generator.reset();
                    const finalText = await generator.generate(undefined, {
                        maxLength: 200,
                        temperature: 1,
                        includeProbabilities: false,
                        topP: topP > 0 ? topP : undefined,
                    });
                    setGenerate(false);
                    setText(finalText);
                    textRef.current = finalText;
                    await wait(10);
                };
                model.on('trainStep', h);
                return () => {
                    model.off('trainStep', h);
                };
            }
        }
    }, [model, ready, outputText, topP]);

    useEffect(() => {
        if (generator) {
            const h = (_: number[], newText: string, attention?: number[][][][], probabilities?: number[][]) => {
                textRef.current += newText;
                setText(textRef.current);

                if (attention) {
                    attentionRef.current = [...attentionRef.current, attention];
                }

                if (probabilities) {
                    probRef.current = [...probRef.current, ...probabilities];
                }
            };
            generator.on('tokens', h);
            return () => {
                generator.off('tokens', h);
                generator.dispose();
            };
        }
    }, [generator]);

    const doGenerate = (maxLength: number) => {
        if (!generator || (status !== 'ready' && status !== 'busy' && status !== 'awaitingTokens')) {
            setShowStatus(true);
            return;
        }
        if (busyRef.current) {
            generator.stop();
            return;
        }
        busyRef.current = true;
        if (maxLength > 1) setGenerate(true);
        setHasGenerated(true);

        generator
            .generate(textRef.current.length > 0 ? textRef.current : undefined, {
                maxLength,
                temperature,
                attentionScores: enableAttention,
                includeProbabilities: enableProbabilities,
                topP: topP > 0 ? topP : undefined,
                noCache: false,
            })
            .then(() => {
                setText(textRef.current);

                if (attentionRef.current.length > 0) {
                    setAttentionData(attentionRef.current);
                }
                if (probRef.current.length > 0) {
                    setProbabilities(probRef.current);
                }
                setGenerate(false);
                busyRef.current = false;
            });
    };

    return (
        <Box
            widget="generator"
            style={{ maxWidth: '500px' }}
            active={!!model}
        >
            <div
                className={style.container}
                data-testid="textgenerator"
            >
                <BoxTitle
                    title={t('generator.title')}
                    status={!model ? 'disabled' : generate ? 'busy' : ready && !generate ? 'done' : 'waiting'}
                />
                <div className={style.xaiRow}>
                    <TextHighlighter
                        text={text}
                        mode={!hasGenerated ? 'edit' : enableAttention && !generate ? 'probability' : 'plain'}
                        onSelectToken={(_, index) => setSelected(index)}
                        selected={selected}
                        probabilities={
                            enableAttention && !generate && hasGenerated
                                ? createProbabilities(attentionData, 1, selected, attentionBlock)
                                : undefined
                        }
                        tokeniser={status !== 'loading' ? model?.tokeniser : undefined}
                        active={generate}
                        onChange={(newText) => {
                            setText(newText);
                            textRef.current = newText;
                        }}
                    />
                    <XAIView probabilities={topKTokens} />
                    <GeneratorSettings
                        open={showSettings}
                        onClose={() => setShowSettings(false)}
                    />
                    <ModelStatus
                        model={model}
                        show={showStatus}
                        onClose={() => setShowStatus(false)}
                    />
                </div>
                <Controls
                    onGenerate={() => doGenerate(autoMode ? maxLength : 1)}
                    disable={disable}
                    generate={generate}
                    onCopy={() => navigator.clipboard.writeText(textRef.current)}
                    onReset={() => {
                        if (generate && generator) {
                            generator.stop();
                        }
                        generator?.reset();
                        setHasGenerated(false);
                        setText('');
                        textRef.current = '';
                        setAttentionData([]);
                        attentionRef.current = [];
                        setProbabilities([]);
                        probRef.current = [];
                        setSelected(-1);
                    }}
                    onShowSettings={() => setShowSettings(true)}
                    enableSettings={enableSettings}
                    autoMode={autoMode}
                    onAutoModeChange={setAutoMode}
                />
            </div>
        </Box>
    );
}
