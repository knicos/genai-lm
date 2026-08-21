import { useTranslation } from 'react-i18next';
import { useEffect, useMemo, useRef, useState } from 'react';
import Predictions from './Predictions';
import SampleBox from './SampleBox';
import style from './style.module.css';
import ModelBox from './ModelBox';
import ModelLines from './ModelLines';
import InfoPanel from '../../workflow/TextData/InfoPanel';
import { AnimationStep, AnimationStepName } from './ModelControls';
import { IGeneratorResponse, TeachableLLM } from '@genai-fi/nanogpt';
import OutputBox from './OutputBox';
import { MULTINOMIAL_ANIMATION_DURATION } from './Multinomial';
import DataBox from './DataBox';
import { splitResponse } from './utilities';

interface Props {
    responseId: string | null;
    model: TeachableLLM | null;
    step: AnimationStep | null;
    loaded: boolean;
}

export function Inference({ responseId, step, model, loaded }: Props) {
    const { t } = useTranslation();
    const [text, setText] = useState<string>('');
    const [predictions, setPredictions] = useState<number[][]>([]);
    const nextToken = useRef<number | null>(null);
    const [attention, setAttention] = useState<number[][]>([]);
    const [multinomialRand, setMultinomialRand] = useState<number | null>(null);
    const [warn] = useState<boolean>(false);
    const stepNameRef = useRef<AnimationStepName>('none');
    const stepRef = useRef<AnimationStep | null>(null);
    const nextTextRef = useRef<string>('');
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (model && responseId && loaded && step && stepNameRef.current !== step?.name) {
            stepNameRef.current = step.name;

            stepRef.current = step;
            if (step.name === 'next') {
                setText(nextTextRef.current);
                step.locked = true;
                model.responses.resume(responseId);
            } else if (step.name === 'done') {
                //virtualGenerator?.finishStep();
            } else if (step.name === 'updating') {
                step.locked = true;
                // Hack: Should detect end of animation from callback
                setTimeout(() => {
                    step.locked = false;
                }, MULTINOMIAL_ANIMATION_DURATION);
            }
        }
    }, [model, loaded, step, responseId]);

    useEffect(() => {
        if (model && responseId) {
            const handleUpdate = (id: string) => {
                if (id !== responseId) return;
                if (stepRef.current && stepRef.current.locked) {
                    stepRef.current.locked = false;
                }
                const response = model.responses.getResponse(id) as IGeneratorResponse | null;
                if (!response) return;
                const split = splitResponse(response);
                setAttention(split.attention);
                setPredictions(split.predictions);
                setMultinomialRand(split.multinomialRand);
                nextToken.current = split.token;
                nextTextRef.current = split.text;
            };
            model.responses.on('hook', handleUpdate);
            model.responses.hook(responseId);
            model.responses.resume(responseId);

            setIsGenerating(true);

            const handleEnd = (id: string) => {
                if (id === responseId) {
                    setIsGenerating(false);
                }
            };
            model.responses.on('done', handleEnd);

            return () => {
                model.responses.off('hook', handleUpdate);
                model.responses.off('done', handleEnd);
            };
        }
    }, [model, responseId]);

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
            <DataBox inferenceMode />
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
                    predictions={(step?.layer ?? -1) >= 0 ? (predictions[step?.layer ?? 0] ?? []) : []}
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
            {!isGenerating && (
                <div className={style.hint}>
                    <span>{t('tools.inferenceHint')}</span>
                </div>
            )}
        </>
    );
}
