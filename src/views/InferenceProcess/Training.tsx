import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';
import { datasetAtom } from '../../state/data';
import { useRef, useState } from 'react';
import extractData from './extractData';
import { Conversation, TeachableLLM, topP } from '@genai-fi/nanogpt';
import Predictions from './Predictions';
import SampleBox from './SampleBox';
import style from './style.module.css';
import LossBox from './LossBox';
import ModelBox from './ModelBox';
import ModelLines from './ModelLines';
import InfoPanel from '../../workflow/TextData/InfoPanel';
import { AnimationStep, AnimationStepName } from './ModelControls';
import { reduceAttention } from './attention';

interface Props {
    model: TeachableLLM | null;
    step: AnimationStep | null;
    loaded: boolean;
}

export function Training({ model, step, loaded }: Props) {
    const { t } = useTranslation();
    const dataset = useAtomValue(datasetAtom);
    const [tokens, setTokens] = useState<number[]>([]);
    const [predictions, setPredictions] = useState<number[][]>([]);
    const nextToken = useRef<number | null>(null);
    const [loss, setLoss] = useState<number | null>(null);
    const [attention, setAttention] = useState<number[][]>([]);
    const [warn] = useState<boolean>(false);
    const stepRef = useRef<AnimationStepName>('none');

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
    const ready = model && loaded;

    return (
        <>
            <div className={style.block}>
                {ready && (
                    <SampleBox
                        sampleTokens={tokens}
                        tokeniser={model?.tokeniser}
                        selectedTokenIndex={128}
                        attention={currentAttention}
                        showTokens={step?.name !== 'next' && !finished}
                        showAnswer={finished}
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
                />
            )}
            {ready && (
                <Predictions
                    predictions={(step?.layer ?? -1 >= 0) ? (predictions[step?.layer ?? 0] ?? []) : []}
                    vocab={model.tokeniser.getVocab()}
                    target={nextToken.current ?? undefined}
                    size={6}
                    finished={finished}
                    inferenceMode={false}
                    committed={step?.name === 'done'}
                    multinomialRand={null}
                />
            )}
            {ready && (
                <LossBox
                    loss={finished ? (loss ?? undefined) : undefined}
                    model={model}
                    updating={step?.name === 'updating'}
                />
            )}
        </>
    );
}
