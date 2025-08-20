import style from './style.module.css';
import { IconButton, TextField } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { CharTokeniser, TeachableLLM } from '@genai-fi/nanogpt';
import TextHighlighter from '../TextHighlighter/TextHighlighter';
import { Button } from '@genai-fi/base';
import ModelStatus from '../ModelStatus/ModelStatus';
import useModelStatus from '../../utilities/useModelStatus';
import BoxTitle from '../BoxTitle/BoxTitle';
import { useTranslation } from 'react-i18next';
import XAIView from './XAIView';
import TuneIcon from '@mui/icons-material/Tune';
import GeneratorSettings from './GeneratorSettings';
import { wait } from '../../utilities/wait';

interface Props {
    model?: TeachableLLM;
}

function createProbabilities(attentionData: number[][], offset: number, index: number, length: number): number[] {
    const data = attentionData[index];
    if (!data) return [];
    const realIndex = Math.min(index + offset - 1, data.length - 1);
    const probabilities = new Array(length).fill(0);
    for (let i = 0; i <= realIndex; i++) {
        const idx = index - realIndex + i - 1;
        if (idx >= 0) {
            probabilities[idx] = data[i] || 0;
        }
    }
    return probabilities;
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
    const [attentionData, setAttentionData] = useState<number[][]>([]);
    const [probabilities, setProbabilities] = useState<number[][]>([]);
    const [topKTokens, setTopKTokens] = useState<{ token: string; probability: number }[]>([]);
    const [prompt, setPrompt] = useState<string>('');
    const [selected, setSelected] = useState<number>(0);
    const status = useModelStatus(model);
    const [ready, setReady] = useState(false);
    const [busy, setBusy] = useState(false);
    const [temperature, setTemperature] = useState<number>(1);
    const [showSettings, setShowSettings] = useState<boolean>(false);

    const attentionRef = useRef<number[][]>([]);
    const probRef = useRef<number[][]>([]);
    const textRef = useRef<string>('');

    useEffect(() => {
        if (status === 'ready') {
            setReady(true);
        }
    }, [status]);

    useEffect(() => {
        if (ready) {
            setTopKTokens(createTopKTokens(probabilities[selected] || [], 5, model?.tokeniser as CharTokeniser));
        }
    }, [probabilities, selected, model, ready]);

    useEffect(() => {
        if (ready && model) {
            const generator = model.generator();
            setGenerator(generator);
            setText('');
            setAttentionData([]);

            const state = {
                count: 0,
            };

            const h = async () => {
                state.count++;
                if (state.count % 2 !== 0) return;
                setText(''); // Clear previous text
                setAttentionData([]); // Clear previous attention data
                textRef.current = '';
                const finalText = await generator.generate(undefined, {
                    maxLength: 200,
                    temperature: 1,
                    includeAttention: false,
                    includeProbabilities: false,
                });
                setText(finalText);
                textRef.current = '';
                await wait(40);
            };
            model.on('trainStep', h);
            return () => {
                model.off('trainStep', h);
            };
        }
    }, [model, ready]);

    useEffect(() => {
        if (generator) {
            const h = (_: number[], newText: string, attention?: number[][], probabilities?: number[][]) => {
                //setText((prevText) => prevText + newText);
                textRef.current += newText;
                if (textRef.current.length % 5 === 0) {
                    setText(textRef.current);
                }

                if (attention) {
                    attentionRef.current = [...attentionRef.current, ...attention];
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
        <div
            className={style.container}
            data-testid="textgenerator"
        >
            <BoxTitle
                title={t('generator.title')}
                done={ready && !busy}
                busy={busy}
            />
            <div className={style.xaiRow}>
                <TextHighlighter
                    text={text}
                    mode="probability"
                    onSelectToken={(_, index) => setSelected(index)}
                    selected={selected}
                    probabilities={createProbabilities(
                        attentionData,
                        prompt.length === 0 ? 1 : prompt.length,
                        selected,
                        text.length
                    )}
                />
                <XAIView probabilities={topKTokens} />
                <GeneratorSettings
                    open={showSettings}
                    onClose={() => setShowSettings(false)}
                    temperature={temperature}
                    onTemperatureChange={setTemperature}
                />
            </div>
            <div className={style.titleRow}>
                <div className={style.buttonBox}>
                    <IconButton onClick={() => setShowSettings(true)}>
                        <TuneIcon />
                    </IconButton>
                    <TextField
                        variant="outlined"
                        size="small"
                        placeholder={t('generator.promptPlaceholder')}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />
                    <Button
                        size="large"
                        variant="contained"
                        disabled={!generator || busy}
                        onClick={() => {
                            if (!generator) return;
                            setText(''); // Clear previous text
                            setAttentionData([]); // Clear previous attention data
                            setProbabilities([]); // Clear previous probabilities
                            setBusy(true);
                            textRef.current = '';
                            generator
                                .generate(prompt.length > 0 ? prompt : undefined, {
                                    maxLength: 400,
                                    temperature,
                                    includeAttention: true,
                                    includeProbabilities: true,
                                    noCache: true,
                                    usePadding: true,
                                })
                                .then((finaltext: string) => {
                                    setText(finaltext);
                                    textRef.current = '';
                                    if (attentionRef.current.length > 0) {
                                        setAttentionData(attentionRef.current);
                                        attentionRef.current = [];
                                    }
                                    if (probRef.current.length > 0) {
                                        setProbabilities(probRef.current);
                                        probRef.current = [];
                                    }
                                    setBusy(false);
                                });
                        }}
                    >
                        {t('generator.generate')}
                    </Button>

                    <ModelStatus model={model} />
                </div>
            </div>
        </div>
    );
}
