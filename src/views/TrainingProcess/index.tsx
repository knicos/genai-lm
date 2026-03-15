import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';
import { datasetAtom } from '../../state/data';
import { modelAtom } from '../../state/model';
import { useEffect, useMemo, useRef, useState } from 'react';
import extractData from './extractData';
import useModelLoaded from '../../hooks/useModelLoaded';
import { Conversation, topP } from '@genai-fi/nanogpt';
import Predictions from './Predictions';
import SampleBox from './SampleBox';
import style from './style.module.css';
import LossBox from './LossBox';
import ModelBox from './ModelBox';
import ModelLines from './ModelLines';
import InfoPanel from '../../workflow/TextData/InfoPanel';
import ModelControls, { AnimationStep, AnimationStepName } from './ModelControls';

function reduceAttention(attentionData: number[][][][]): number[][] {
    // layer, head, _, sequence
    // Reduce to layer and sequence by taking the max over heads
    const reduced: number[][] = [];
    for (const layerData of attentionData) {
        const seqLength = layerData[0][0].length;
        const sums = new Array(seqLength).fill(0);
        let overallMax = 0;

        for (const head of layerData) {
            for (let i = 0; i < seqLength; i++) {
                const v = head[0][i];
                overallMax = Math.max(overallMax, v);
                sums[i] = Math.max(sums[i], v);
            }
        }

        // Normalize
        for (let i = 0; i < seqLength; i++) {
            sums[i] = sums[i] / overallMax;
        }
        reduced.push(sums);
    }
    return reduced;
}

export function Component() {
    const { t } = useTranslation();
    const dataset = useAtomValue(datasetAtom);
    const model = useAtomValue(modelAtom);
    const loaded = useModelLoaded(model ?? undefined);
    const [tokens, setTokens] = useState<number[]>([]);
    const [predictions, setPredictions] = useState<number[][]>([]);
    const nextToken = useRef<number | null>(null);
    const [loss, setLoss] = useState<number | null>(null);
    const [attention, setAttention] = useState<number[][]>([]);
    const [warn] = useState<boolean>(false);
    const [step, setStep] = useState<AnimationStep | null>(null);
    const stepRef = useRef<AnimationStepName>('none');

    const steps = useMemo<AnimationStep[]>(() => {
        if (!model || !loaded) return [];
        const s: AnimationStep[] = [];
        s.push({ name: 'next', layer: -1, index: 0 });
        // s.push({ name: 'wait', layer: -1, index: 1 });
        for (let i = 0; i < model.config.nLayer; i++) {
            s.push({ name: 'predict', layer: i, index: i + 1 });
        }
        s.push({ name: 'updating', layer: model.config.nLayer - 1, index: model.config.nLayer + 1 });
        s.push({ name: 'done', layer: model.config.nLayer - 1, index: model.config.nLayer + 2 });
        return s;
    }, [model, loaded]);

    useEffect(() => {
        setStep(steps[0] ?? null);
    }, [steps]);

    const loadNext = async () => {
        if (!model || !loaded) return [];
        if (!model.tokeniser.trained) {
            await model.tokeniser.train(dataset);
        }

        const vocab = model.tokeniser.getVocab();
        const largestToken = Math.max(1, vocab[vocab.length - 1].length);
        const totalDatasetLength = dataset.reduce((sum, item) => sum + item.length, 0);
        const sliceSize = Math.floor((model.config.blockSize + 1) * largestToken * 1.5);
        // eslint-disable-next-line react-hooks/purity
        const randomStart = Math.floor(Math.random() * Math.max(1, totalDatasetLength - sliceSize));
        const sampleText = extractData(dataset, randomStart, sliceSize + randomStart);

        const newTokens = model.tokeniser.encode(sampleText);
        const slicedTokens = newTokens.slice(0, model.config.blockSize);
        const decodedText = model.tokeniser.decode(slicedTokens);
        const actualNextToken = newTokens[slicedTokens.length] || 0;

        nextToken.current = actualNextToken;
        const newText: Conversation[] = [{ role: 'assistant', content: decodedText }];
        setTokens(newTokens);
        setPredictions([]);
        return newText;
    };

    const generateText = async (text: Conversation[]) => {
        if (!model || !loaded) return;
        if (text.length === 0) return;
        if (text[0].content.length === 0) return;
        const generator = model.generator();

        await generator.generate(text, {
            maxLength: 1,
            includeProbabilities: true,
            attentionScores: true,
            embeddings: 'softmax',
            temperature: 0.8,
            topP: 0.9,
            targets: [nextToken.current ?? 0],
            nonConversational: true,
            continuation: true,
        });
        const probsData = generator.getProbabilitiesData();
        const top = probsData && probsData[0] ? topP(probsData[0], 0.9) : [];

        const attentionData = generator.getAttentionData();
        setAttention(reduceAttention(attentionData[0]));

        const embeddingData = generator
            .getEmbeddingsData()[0]
            .filter((e) => e.name.startsWith('block_output_'))
            .map((e) => e.tensor[0]);

        embeddingData[embeddingData.length - 1] = top;

        setLoss(generator.getLastLoss());

        setPredictions(embeddingData);
        generator.dispose();
    };

    if (model && loaded && step && stepRef.current !== step?.name) {
        stepRef.current = step.name;
        if (step.name === 'next') {
            step.locked = true;
            loadNext()
                .then((newText) => {
                    generateText(newText)
                        .then(() => {
                            step.locked = false;
                        })
                        .catch((e) => {
                            step.locked = false;
                            console.error('Error during generation:', e);
                        });
                })
                .catch((e) => {
                    step.locked = false;
                    console.error('Error loading next sample:', e);
                });
        }
    }

    const layers = model && loaded ? model.config.nLayer : 0;
    const finished = step?.name === 'done' || step?.name === 'updating';
    const hasLayer = step && step.layer >= 0;
    const currentAttention = hasLayer ? (attention[step.layer] ?? null) : null;
    const ready = model && loaded && dataset.length > 0;

    return (
        <div className="sidePanel">
            <h2>{t('tools.trainingProcess')}</h2>
            <ModelControls
                disabled={!ready}
                steps={steps}
                onStepChange={setStep}
            />
            <div className={style.block}>
                {ready && (
                    <SampleBox
                        sampleTokens={tokens}
                        tokeniser={model?.tokeniser}
                        selectedTokenIndex={128}
                        attention={currentAttention}
                    />
                )}
                <InfoPanel
                    show={!ready}
                    severity={warn ? 'warning' : 'info'}
                    message={t('tools.modelMissingHint')}
                />
            </div>
            {ready && <ModelLines />}
            {ready && (
                <ModelBox
                    layers={layers}
                    step={finished ? layers : (step?.layer ?? -1)}
                    done={finished}
                    spinning={step?.name === 'updating'}
                />
            )}
            {ready && (
                <Predictions
                    predictions={(step?.layer ?? -1 >= 0) ? (predictions[step?.layer ?? 0] ?? []) : []}
                    vocab={model.tokeniser.getVocab()}
                    target={nextToken.current ?? undefined}
                    size={6}
                    finished={finished}
                />
            )}
            {ready && (
                <LossBox
                    loss={finished ? (loss ?? undefined) : undefined}
                    model={model}
                    updating={step?.name === 'updating'}
                />
            )}
        </div>
    );
}
