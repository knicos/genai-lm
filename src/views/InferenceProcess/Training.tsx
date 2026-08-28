import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';
import { dataTokens } from '../../state/data';
import { useEffect, useRef, useState } from 'react';
import { Conversation, TeachableLLM } from '@genai-fi/nanogpt';
import Predictions from './Predictions';
import SampleBox from './SampleBox';
import style from './style.module.css';
import LossBox from './LossBox';
import ModelBox from './ModelBox';
import ModelLines from './ModelLines';
import InfoPanel from '../../workflow/TextData/InfoPanel';
import { AnimationStep, AnimationStepName } from './ModelControls';
import DataBox from './DataBox';
import { trainerJobIdAtom } from '../../state/trainer';
import { splitResponse } from './utilities';

interface Props {
    model: TeachableLLM | null;
    step: AnimationStep | null;
    loaded: boolean;
}

export function Training({ model, step, loaded }: Props) {
    const { t } = useTranslation();
    const dataset = useAtomValue(dataTokens);
    const [tokens, setTokens] = useState<number[]>([]);
    const [predictions, setPredictions] = useState<number[][]>([]);
    const nextToken = useRef<number | null>(null);
    const [loss, setLoss] = useState<number | null>(null);
    const [attention, setAttention] = useState<number[][]>([]);
    const stepRef = useRef<AnimationStepName>('none');
    const trainerJobId = useAtomValue(trainerJobIdAtom);
    const [isTraining, setIsTraining] = useState(false);

    useEffect(() => {
        if (trainerJobId && model) {
            const job = model.training.getJob(trainerJobId);

            const hStart = (id: string) => {
                if (id === trainerJobId) {
                    setIsTraining(true);
                }
            };
            const hEnd = (id: string) => {
                if (id === trainerJobId && job) {
                    setIsTraining(job.state === 'running' || job.state === 'paused');
                }
            };
            model.training.on('running', hStart);
            model.training.on('completed', hEnd);
            model.training.on('cancelled', hEnd);

            let bpid: number | undefined;

            if (job) {
                bpid = model.training.addBreak(job.id);
            }

            setIsTraining(job?.state === 'running');

            return () => {
                model.training.off('running', hStart);
                model.training.off('completed', hEnd);
                model.training.off('cancelled', hEnd);
                if (bpid !== undefined && job) {
                    model.training.deleteBreak(job.id, bpid);
                }
            };
        }
    }, [model, trainerJobId]);

    const loadNext = async () => {
        if (!model || !loaded) return [];
        if (!model.tokeniser.trained) {
            return [];
        }
        if (!dataset) return [];

        const totalDatasetLength = dataset.tokens.getTokenCount();
        const sliceSize = model.config.blockSize + 1;
        // eslint-disable-next-line react-hooks/purity
        const randomStart = Math.floor(Math.random() * Math.max(1, totalDatasetLength - sliceSize));
        const newTokens = await dataset.tokens.slice(randomStart, randomStart + sliceSize);
        const slicedTokens = newTokens.slice(0, model.config.blockSize);
        const decodedText = model.tokeniser.decode(slicedTokens);
        const actualNextToken = newTokens[model.config.blockSize] || 0;

        nextToken.current = actualNextToken;
        const newText: Conversation[] = [{ role: 'text', content: decodedText }];
        setTokens(Array.from(slicedTokens));
        setPredictions([]);
        return newText;
    };

    const generateText = async (text: Conversation[]) => {
        if (!model || !loaded) return;
        if (text.length === 0) return;
        if (text[0].content.length === 0) return;

        const response = await model.responses.create({
            input: text,
            maxLength: 1,
            outputScores: true,
            outputAttention: true,
            outputHiddenStates: 'softmax',
            outputLoss: true,
            outputScore: true,
            temperature: 0.8,
            topP: 0.9,
            targets: [nextToken.current ?? 0],
            nonConversational: true,
            continuation: true,
        });

        const split = splitResponse(response);
        setAttention(split.attention);
        setLoss(split.loss);
        setPredictions(split.predictions);
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
            <DataBox />
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
                    severity={'info'}
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
            {!isTraining && (
                <div className={style.hint}>
                    <span>{t('tools.trainingHint')}</span>
                </div>
            )}
        </>
    );
}
