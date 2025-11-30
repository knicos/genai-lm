import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';
import { datasetAtom } from '../../state/data';
import { modelAtom } from '../../state/model';
import { useEffect, useReducer, useRef, useState } from 'react';
import extractData from './extractData';
import useModelLoaded from '../../utilities/useModelLoaded';
import { topP } from '@genai-fi/nanogpt';
import Predictions from './Predictions';
import SampleBox from './SampleBox';
import { trainerAtom } from '../../state/trainer';
import style from './style.module.css';
import LossBox from './LossBox';
import ModelBox from './ModelBox';
import ModelLines from './ModelLines';
import InfoPanel from '../../workflow/TextData/InfoPanel';
import ModelControls from './ModelControls';

function reduceAttention(attentionData: number[][][][]): number[][] {
    // layer, head, _, sequence
    // Reduce to layer and sequence by taking the max over heads
    const reduced: number[][] = [];
    for (let layer = 0; layer < attentionData.length; layer++) {
        const layerData = attentionData[layer];
        const seqLength = layerData[0][0].length;
        const sums = new Array(seqLength).fill(0);
        let overallMax = 0;

        for (let head = 0; head < layerData.length; head++) {
            for (let i = 0; i < seqLength; i++) {
                const v = layerData[head][0][i];
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
    const [text, setText] = useState<string>('');
    const [tokens, setTokens] = useState<number[]>([]);
    const [predictions, setPredictions] = useState<number[][]>([]);
    const [trigger, doNext] = useReducer((x) => x + 1, 0);
    const nextToken = useRef<number | null>(null);
    const trainer = useAtomValue(trainerAtom);
    const [loss, setLoss] = useState<number | null>(null);
    const [step, setStep] = useState<number>(0);
    const [attention, setAttention] = useState<number[][]>([]);
    const [warn, setWarn] = useState<boolean>(false);

    useEffect(() => {
        if (model && loaded && dataset.length > 0) {
            setWarn(false);
            const h = async () => {
                if (!model.tokeniser.trained) {
                    await model.tokeniser.train(dataset);
                }

                const vocab = model.tokeniser.getVocab();
                const largestToken = Math.max(1, vocab[vocab.length - 1].length);
                const totalDatasetLength = dataset.reduce((sum, item) => sum + item.length, 0);
                const sliceSize = (model.config.blockSize + 1) * largestToken;
                const randomStart = Math.floor(Math.random() * Math.max(1, totalDatasetLength - sliceSize));
                const sampleText = extractData(dataset, randomStart, sliceSize + randomStart);

                const newTokens = await model.tokeniser.encode(sampleText);
                const slicedTokens = newTokens.slice(0, model.config.blockSize);
                const decodedText = await model.tokeniser.decode(slicedTokens);
                const actualNextToken = newTokens[slicedTokens.length] || 0;

                nextToken.current = actualNextToken;
                setText(decodedText);
                setTokens(newTokens);
                setStep(0);
            };
            h();
        }
    }, [model, loaded, dataset, trigger]);

    useEffect(() => {
        if (loaded && model && text.length > 0) {
            const h = async () => {
                const generator = model.generator();
                await generator.generate(text, {
                    maxLength: 1,
                    includeProbabilities: true,
                    attentionScores: true,
                    embeddings: 'softmax',
                    temperature: 1.0,
                    topP: 0.9,
                    targets: [nextToken.current ?? 0],
                });
                const probsData = generator.getProbabilitiesData();
                const top = topP(probsData[0], 0.9);

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
            h();
            if (trainer) {
                trainer.on('log', h);
                return () => {
                    trainer.off('log', h);
                };
            }
        }
    }, [loaded, text, model, trainer]);

    const layers = model && loaded ? model.config.nLayer : 0;
    const finished = step === layers;
    const currentAttention = step === 0 ? null : attention[step - 1] || null;
    const ready = model && loaded && dataset.length > 0;

    return (
        <div className="sidePanel">
            <h2>{t('tools.trainingProcess')}</h2>
            <ModelControls
                step={step}
                totalSteps={layers}
                onIncrement={setStep}
                delay={300}
                onNext={() => {
                    if (model && loaded && dataset.length > 0) doNext();
                    else setWarn(true);
                }}
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
                    step={step}
                />
            )}
            {ready && (
                <Predictions
                    predictions={step > 0 ? predictions[step - 1] ?? [] : []}
                    vocab={model.tokeniser.getVocab()}
                    target={nextToken.current ?? undefined}
                    size={6}
                    finished={finished}
                />
            )}
            {ready && (
                <LossBox
                    loss={finished ? loss ?? undefined : undefined}
                    model={model}
                />
            )}
        </div>
    );
}
