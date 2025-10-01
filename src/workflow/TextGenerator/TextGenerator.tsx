import style from './style.module.css';
import { IconButton, Tooltip } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { CharTokeniser, TeachableLLM } from '@genai-fi/nanogpt';
import TextHighlighter, { ProbabilityItem } from '../../components/TextHighlighter/TextHighlighter';
import { Button } from '@genai-fi/base';
import useModelStatus from '../../utilities/useModelStatus';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import { useTranslation } from 'react-i18next';
import XAIView from './XAIView';
import TuneIcon from '@mui/icons-material/Tune';
import GeneratorSettings from './GeneratorSettings';
import { wait } from '../../utilities/wait';
import { useAtomValue } from 'jotai';
import {
    generatorAttentionBlock,
    generatorMaxLength,
    generatorShowAttention,
    generatorShowProbabilities,
    generatorShowPrompt,
    generatorShowSettings,
    generatorTemperature,
} from '../../state/generatorSettings';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ModelStatus from '../../components/ModelStatus/ModelStatus';
import Box from '../../components/BoxTitle/Box';
import { trainerOutputText } from '../../state/trainerSettings';

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
    const enablePrompt = useAtomValue(generatorShowPrompt);
    const temperature = useAtomValue(generatorTemperature);
    const maxLength = useAtomValue(generatorMaxLength);
    const outputText = useAtomValue(trainerOutputText);
    const [showStatus, setShowStatus] = useState<boolean>(false);

    const attentionRef = useRef<number[][][][][]>([]);
    const probRef = useRef<number[][]>([]);
    const textRef = useRef<string>('');
    const busyRef = useRef<boolean>(false);

    const disable = status === 'training';

    /*useEffect(() => {
        if (status === 'ready') {
            setReady(true);
        }
    }, [status]);*/

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
                    const finalText = await generator.generate(undefined, {
                        maxLength: 200,
                        temperature: 1,
                        includeProbabilities: false,
                    });
                    setGenerate(false);
                    setText(finalText);
                    textRef.current = '';
                    await wait(40);
                };
                model.on('trainStep', h);
                return () => {
                    model.off('trainStep', h);
                };
            }
        }
    }, [model, ready, outputText]);

    useEffect(() => {
        if (generator) {
            const h = (_: number[], newText: string, attention?: number[][][][], probabilities?: number[][]) => {
                //setText((prevText) => prevText + newText);
                textRef.current += newText;
                //if (textRef.current.length % 5 === 0) {
                setText(textRef.current);
                //}

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
            };
        }
    }, [generator]);

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
                    style={{ backgroundColor: '#444', color: 'white' }}
                    dark={true}
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
                {enablePrompt && (
                    <div className={style.titleRow}>
                        <Button
                            size="large"
                            variant="contained"
                            disabled={disable}
                            startIcon={generate ? <PauseIcon /> : <PlayArrowIcon />}
                            onClick={() => {
                                if (!generator || (status !== 'ready' && status !== 'busy')) {
                                    setShowStatus(true);
                                    return;
                                }
                                if (busyRef.current) {
                                    generator.stop();
                                    return;
                                }
                                busyRef.current = true;
                                //setText(''); // Clear previous text
                                //setAttentionData([]); // Clear previous attention data
                                //setProbabilities([]); // Clear previous probabilities
                                setGenerate(true);
                                setHasGenerated(true);
                                //textRef.current = '';
                                generator
                                    .generate(textRef.current.length > 0 ? textRef.current : undefined, {
                                        maxLength,
                                        temperature,
                                        attentionScores: enableAttention,
                                        includeProbabilities: enableProbabilities,
                                    })
                                    .then(() => {
                                        setText(textRef.current);
                                        //textRef.current = '';
                                        if (attentionRef.current.length > 0) {
                                            setAttentionData(attentionRef.current);
                                            //attentionRef.current = [];
                                        }
                                        if (probRef.current.length > 0) {
                                            setProbabilities(probRef.current);
                                            //probRef.current = [];
                                        }
                                        setGenerate(false);
                                        busyRef.current = false;
                                    });
                            }}
                        >
                            {generate ? t('generator.pause') : t('generator.generate')}
                        </Button>
                        <div className={style.iconButtons}>
                            <Tooltip
                                title={t('generator.reset')}
                                arrow
                            >
                                <IconButton
                                    color="inherit"
                                    disabled={disable}
                                    onClick={() => {
                                        if (generate && generator) {
                                            generator.stop();
                                        }
                                        setHasGenerated(false);
                                        setText('');
                                        textRef.current = '';
                                        setAttentionData([]);
                                        attentionRef.current = [];
                                        setProbabilities([]);
                                        probRef.current = [];
                                        setSelected(-1);
                                    }}
                                >
                                    <RefreshIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip
                                title={t('generator.copy')}
                                arrow
                            >
                                <IconButton
                                    color="inherit"
                                    disabled={disable}
                                    onClick={() => {
                                        navigator.clipboard.writeText(textRef.current);
                                    }}
                                >
                                    <ContentCopyIcon />
                                </IconButton>
                            </Tooltip>
                            {enableSettings && (
                                <Tooltip
                                    title={t('generator.settingsTooltip')}
                                    arrow
                                >
                                    <IconButton
                                        color="inherit"
                                        disabled={disable}
                                        onClick={() => setShowSettings(true)}
                                    >
                                        <TuneIcon />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Box>
    );
}
