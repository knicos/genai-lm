import style from './style.module.css';
import { TextField } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { TeachableLLM } from '@genai-fi/nanogpt';
import TextHighlighter from '../TextHighlighter/TextHighlighter';
import { Button } from '@genai-fi/base';
import ModelStatus from '../ModelStatus/ModelStatus';
import useModelStatus from '../../utilities/useModelStatus';
import BoxTitle from '../BoxTitle/BoxTitle';

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

async function wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function TextGenerator({ model }: Props) {
    const [generator, setGenerator] = useState<ReturnType<TeachableLLM['generator']> | undefined>();
    const [text, setText] = useState<string>('');
    const [attentionData, setAttentionData] = useState<number[][]>([]);
    const [prompt, setPrompt] = useState<string>('');
    const [selected, setSelected] = useState<number>(0);
    const status = useModelStatus(model);
    const [ready, setReady] = useState(false);
    const [busy, setBusy] = useState(false);

    const attentionRef = useRef<number[][]>([]);

    useEffect(() => {
        if (status === 'ready') {
            setReady(true);
        }
    }, [status]);

    useEffect(() => {
        if (ready && model) {
            const generator = model.generator();
            setGenerator(generator);
            setText(''); // Clear previous text
            setAttentionData([]); // Clear previous attention data
            /*generator.generate(undefined, {
                maxLength: 400,
                temperature: 0.8,
                includeAttention: true,
            });*/

            const state = {
                count: 0,
            };

            const h = async () => {
                state.count++;
                if (state.count % 2 !== 0) return;
                setText(''); // Clear previous text
                setAttentionData([]); // Clear previous attention data
                await generator.generate(undefined, {
                    maxLength: 200,
                    temperature: 0.8,
                    includeAttention: false,
                });
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
            const h = (_: number[], newText: string, attention?: number[][]) => {
                setText((prevText) => prevText + newText);

                if (attention) {
                    attentionRef.current = [...attentionRef.current, ...attention];
                }
            };
            generator.on('tokens', h);
            return () => {
                generator.off('tokens', h);
            };
        }
    }, [generator]);

    return (
        <div className={style.container}>
            <BoxTitle
                title="Generator"
                done={ready && !busy}
                busy={busy}
            />
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
            <div className={style.titleRow}>
                <div className={style.buttonBox}>
                    <TextField
                        variant="outlined"
                        size="small"
                        placeholder="Optional prompt..."
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
                            setBusy(true);
                            generator
                                .generate(prompt.length > 0 ? prompt : undefined, {
                                    maxLength: 400,
                                    temperature: 0.8,
                                    includeAttention: true,
                                    noCache: true,
                                })
                                .then(() => {
                                    setBusy(false);
                                    if (attentionRef.current.length > 0) {
                                        setAttentionData(attentionRef.current);
                                        attentionRef.current = [];
                                    }
                                });
                        }}
                    >
                        Generate
                    </Button>
                    <ModelStatus model={model} />
                </div>
            </div>
        </div>
    );
}
