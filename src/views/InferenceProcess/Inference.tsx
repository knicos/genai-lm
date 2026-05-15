import { useTranslation } from 'react-i18next';
import { useEffect, useMemo, useRef, useState } from 'react';
import Predictions from './Predictions';
import SampleBox from './SampleBox';
import style from './style.module.css';
import ModelBox from './ModelBox';
import ModelLines from './ModelLines';
import InfoPanel from '../../workflow/TextData/InfoPanel';
import { AnimationStep, AnimationStepName } from './ModelControls';
import VirtualGenerator from './VirtualGenerator';
import { IGenerator, TeachableLLM, topP } from '@genai-fi/nanogpt';
import { reduceAttention } from './attention';
import OutputBox from './OutputBox';
import { MULTINOMIAL_ANIMATION_DURATION } from './Multinomial';

interface Props {
    generator: IGenerator | null;
    model: TeachableLLM | null;
    step: AnimationStep | null;
    loaded: boolean;
}

export function Inference({ generator, step, model, loaded }: Props) {
    const { t } = useTranslation();
    const [text, setText] = useState<string>('');
    const [predictions, setPredictions] = useState<number[][]>([]);
    const nextToken = useRef<number | null>(null);
    const [attention, setAttention] = useState<number[][]>([]);
    const [multinomialRand, setMultinomialRand] = useState<number | null>(null);
    const [warn] = useState<boolean>(false);
    const stepRef = useRef<AnimationStepName>('none');

    const virtualGenerator = generator instanceof VirtualGenerator ? generator : null;

    useEffect(() => {
        if (model && loaded && virtualGenerator && step && stepRef.current !== step?.name) {
            stepRef.current = step.name;
            if (step.name === 'next') {
                step.locked = true;
                virtualGenerator.next().then(() => {
                    if (!virtualGenerator) return;
                    step.locked = false;

                    const probsData = virtualGenerator.generator.getProbabilitiesData();
                    const top = probsData && probsData.length > 0 ? topP(probsData[probsData.length - 1], 0.9) : [];

                    const attentionData = virtualGenerator.generator.getAttentionData();
                    if (attentionData.length > 0) {
                        setAttention(reduceAttention(attentionData[attentionData.length - 1]));
                    }

                    const rawEmbeddingData = virtualGenerator.generator.getEmbeddingsData();
                    if (rawEmbeddingData.length > 0) {
                        const embeddingData = rawEmbeddingData[rawEmbeddingData.length - 1]
                            .filter((e) => e.name.startsWith('block_output_'))
                            .map((e) => e.tensor[0]);
                        embeddingData[embeddingData.length - 1] = top;
                        setPredictions(embeddingData);
                    }

                    const tokens = virtualGenerator.generator.getTokens();
                    nextToken.current = tokens[tokens.length - 1];

                    setMultinomialRand(virtualGenerator.generator.getLastMultinomialRand());
                });
            } else if (step.name === 'done') {
                virtualGenerator?.finishStep();
            } else if (step.name === 'updating') {
                step.locked = true;
                // Hack: Should detect end of animation from callback
                setTimeout(() => {
                    step.locked = false;
                }, MULTINOMIAL_ANIMATION_DURATION);
            }
        }
    }, [model, loaded, virtualGenerator, step]);

    useEffect(() => {
        if (generator) {
            const handleUpdate = () => {
                const conversation = generator.getConversation();
                const text = conversation ? conversation[conversation.length - 1]?.content || '' : '';
                setText(text);
            };
            generator.on('tokens', handleUpdate);
            return () => {
                generator.off('tokens', handleUpdate);
            };
        }
    }, [generator]);

    const tokens = useMemo(() => {
        if (!model || !loaded || !model.tokeniser.trained) return [];
        return model.tokeniser.encode(text);
    }, [model, loaded, text]);

    const layers = model && loaded ? model.config.nLayer : 0;
    const committed = step?.name === 'done';
    const finished = committed || step?.name === 'updating';
    const hasLayer = step && step.layer >= 0;
    const currentAttention = hasLayer ? (attention[step.layer] ?? null) : null;
    const ready = model && loaded;

    return (
        <>
            <div className={style.block}>
                {ready && (
                    <SampleBox
                        sampleTokens={tokens}
                        tokeniser={model?.tokeniser}
                        attention={currentAttention}
                        showTokens
                    />
                )}
                <InfoPanel
                    show={!ready}
                    severity={warn ? 'warning' : 'info'}
                    message={t('tools.modelMissingHint')}
                    dark
                />
            </div>
            {ready && <ModelLines />}
            {ready && (
                <ModelBox
                    layers={layers}
                    step={finished ? layers : (step?.layer ?? -1)}
                    done={finished}
                    spinning={step?.name === 'updating'}
                    inferenceMode
                />
            )}
            {ready && (
                <Predictions
                    predictions={(step?.layer ?? -1 >= 0) ? (predictions[step?.layer ?? 0] ?? []) : []}
                    vocab={model.tokeniser.getVocab()}
                    target={nextToken.current ?? 0}
                    size={6}
                    finished={finished}
                    committed={committed}
                    inferenceMode={true}
                    multinomialRand={multinomialRand}
                    rightMargin={50}
                />
            )}
            {ready && (
                <OutputBox
                    selectedToken={
                        committed && nextToken.current ? model.tokeniser.getVocab()[nextToken.current] : undefined
                    }
                />
            )}
        </>
    );
}
