import style from './style.module.css';
import { useEffect, useRef, useState } from 'react';
import { CharTokeniser, TeachableLLM } from '@genai-fi/nanogpt';
import TextHighlighter from '../../components/TextHighlighter/TextHighlighter';
import useModelStatus from '../../utilities/useModelStatus';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import { useTranslation } from 'react-i18next';
import XAIView from './XAIView';
import { wait } from '../../utilities/wait';
import { useAtom, useAtomValue } from 'jotai';
import { generatorAtom, generatorSettings } from '../../state/generator';
import ModelStatus from '../../components/ModelStatus/ModelStatus';
import Box from '../../components/BoxTitle/Box';
import { trainerSettings } from '../../state/trainer';
import Controls from './Controls';
import { useNavigate } from 'react-router-dom';
import { createProbabilities, createTopKTokens } from './utilities';
import logger from '../../utilities/logger';

interface Props {
    model?: TeachableLLM;
}

export default function TextGenerator({ model }: Props) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [generator, setGenerator] = useAtom(generatorAtom);
    const [text, setText] = useState<string>('');
    const [attentionData, setAttentionData] = useState<number[][][][][]>([]);
    const [probabilities, setProbabilities] = useState<number[][]>([]);
    const [topKTokens, setTopKTokens] = useState<{ token: string; probability: number }[]>([]);
    const [selected, setSelected] = useState<number>(0);
    const status = useModelStatus(model);
    //const [ready, setReady] = useState(false);
    const [generate, setGenerate] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);

    const { temperature, topP, maxLength, showAttention, attentionBlock, showProbabilities, showSettings } =
        useAtomValue(generatorSettings);

    const outputText = useAtomValue(trainerSettings).outputText;
    const [showStatus, setShowStatus] = useState<boolean>(false);
    const [autoMode, setAutoMode] = useState<boolean>(true);

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
            setAttentionData([]);
            setProbabilities([]);
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

                    logger.log({ action: 'auto_generated_text', text: finalText });

                    await wait(10);
                };
                model.on('trainStep', h);
                return () => {
                    model.off('trainStep', h);
                };
            }
        }
    }, [model, ready, outputText, topP, setGenerator]);

    useEffect(() => {
        if (generator) {
            const h = () => {
                setText(generator.getText());
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

        const currentText = generator.getText();

        generator
            .generate(currentText.length > 0 ? currentText : undefined, {
                maxLength,
                temperature,
                attentionScores: showAttention,
                includeProbabilities: showProbabilities,
                topP: topP > 0 ? topP : undefined,
                noCache: false,
            })
            .then(() => {
                setText(generator.getText());
                logger.log({ action: 'generated_text', text: generator.getText() });
                // HACK: Wrong type from library
                setAttentionData(generator.getAttentionData() as unknown as number[][][][][]);
                setProbabilities(generator.getProbabilitiesData()[0] || []);
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
                        mode={!hasGenerated ? 'edit' : showAttention && !generate ? 'probability' : 'plain'}
                        onSelectToken={(_, index) => setSelected(index)}
                        selected={selected}
                        probabilities={
                            showAttention && !generate && hasGenerated
                                ? createProbabilities(attentionData, 1, selected, attentionBlock)
                                : undefined
                        }
                        tokeniser={status !== 'loading' ? model?.tokeniser : undefined}
                        active={generate}
                        onChange={(newText) => {
                            setText(newText);
                        }}
                    />
                    <XAIView probabilities={topKTokens} />
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
                    onCopy={() => navigator.clipboard.writeText(generator?.getText() || '')}
                    onReset={() => {
                        if (generate && generator) {
                            generator.stop();
                        }
                        generator?.reset();
                        setHasGenerated(false);
                        setText('');
                        setAttentionData([]);
                        setProbabilities([]);
                        setSelected(-1);
                    }}
                    onShowSettings={() => {
                        navigate('generator-settings');
                    }}
                    enableSettings={showSettings}
                    autoMode={autoMode}
                    onAutoModeChange={setAutoMode}
                />
            </div>
        </Box>
    );
}
