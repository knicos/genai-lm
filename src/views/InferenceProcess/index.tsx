import { useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { loadedModelAtom } from '../../state/model';
import { useEffect, useMemo, useState } from 'react';
import ModelControls, { AnimationStep } from './ModelControls';
import { Inference } from './Inference';
import { Training } from './Training';
import { trainerJobIdAtom } from '../../state/trainer';
import { inferenceSteps, trainingSteps } from './animationSteps';
import useQueryState from '../../hooks/useQueryState';
import useModelStatus from '../../hooks/useModelStatus';
import ModeSwitch from '../../components/ModeSwitch/ModeSwitch';
import { FormControl } from '@mui/material';
import style from './style.module.css';
import { generatorSettings, rawGenerationIDAtom } from '../../state/generator';

export function Component() {
    const { t } = useTranslation();
    const model = useAtomValue(loadedModelAtom);
    const modelStatus = useModelStatus(model ?? undefined);
    const id = useAtomValue(rawGenerationIDAtom);
    const trainerJobId = useAtomValue(trainerJobIdAtom);
    const [visMode, setVisMode] = useQueryState<'training' | 'inference'>('vismode', 'inference');
    const [step, setStep] = useState<AnimationStep | null>(null);
    const setGeneratorSettings = useSetAtom(generatorSettings);

    const steps = useMemo<AnimationStep[]>(() => {
        if (!model) return [];
        return visMode === 'inference' ? inferenceSteps(model.config) : trainingSteps(model.config);
    }, [model, visMode]);

    useEffect(() => {
        setGeneratorSettings((prev) => ({
            ...prev,
            outputAttention: true,
            outputScores: true,
            outputHiddenStates: 'softmax',
            outputMultinomial: true,
            highlightMode: 'none',
        }));

        return () => {
            setGeneratorSettings((prev) => ({
                ...prev,
                outputAttention: false,
                outputScores: false,
                outputHiddenStates: undefined,
                outputMultinomial: false,
                highlightMode: 'none',
            }));
        };
    }, [setGeneratorSettings]);

    // Hook into the trainer
    useEffect(() => {
        if (model && trainerJobId) {
            const hStart = () => {
                setVisMode('training');
            };

            model.training.on('running', hStart);

            return () => {
                model.training.off('running', hStart);
            };
        }
    }, [model, trainerJobId, steps, setVisMode]);

    useEffect(() => {
        setStep(steps[0] ?? null);
    }, [steps]);

    const ready = !!model;

    return (
        <div className="sidePanel">
            <header className={style.header}>
                <h2>{t('tools.trainingProcess')}</h2>
                <FormControl>
                    <ModeSwitch
                        mode={visMode === 'inference'}
                        setMode={(mode: boolean) => setVisMode(mode ? 'inference' : 'training')}
                        startLabel={t('app.settings.trainingVis')}
                        endLabel={t('app.settings.inferenceVis')}
                        disabled={modelStatus !== 'ready'}
                    />
                </FormControl>
            </header>
            <div className={style.inferenceContainer}>
                <ModelControls
                    disabled={!ready || modelStatus === 'training' || modelStatus === 'busy'}
                    steps={steps}
                    onStepChange={setStep}
                    model={model}
                    responseId={id}
                />
                {visMode === 'inference' ? (
                    <Inference
                        responseId={id}
                        step={step}
                        model={model}
                        loaded={true}
                    />
                ) : (
                    <Training
                        model={model}
                        loaded={true}
                        step={step}
                    />
                )}
            </div>
        </div>
    );
}
