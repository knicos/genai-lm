import { useAtom, useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';
import { loadedModelAtom } from '../../state/model';
import { useEffect, useMemo, useState } from 'react';
import ModelControls, { AnimationStep } from './ModelControls';
import { rawGeneratorAtom } from '../../state/generator';
import VirtualGenerator from './VirtualGenerator';
import { Inference } from './Inference';
import { Training } from './Training';
import { trainerAtom } from '../../state/trainer';
import { inferenceSteps, trainingSteps } from './animationSteps';
import useQueryState from '../../hooks/useQueryState';
import useModelStatus from '../../hooks/useModelStatus';

export function Component() {
    const { t } = useTranslation();
    const model = useAtomValue(loadedModelAtom);
    const modelStatus = useModelStatus(model ?? undefined);
    const [generator, setGenerator] = useAtom(rawGeneratorAtom);
    const trainer = useAtomValue(trainerAtom);
    const [visMode, setVisMode] = useQueryState<'training' | 'inference'>('vismode', 'inference');
    const [step, setStep] = useState<AnimationStep | null>(null);

    // Hook into the generator
    useEffect(() => {
        if (visMode === 'training') return;
        if (!model) return;

        setGenerator((old) => {
            if (old) {
                return new VirtualGenerator(old);
            }
            return new VirtualGenerator(model);
        });

        return () => {
            setGenerator((old) => {
                if (old instanceof VirtualGenerator) {
                    const gen = old.generator;
                    old.dispose();
                    return gen;
                } else {
                    return old;
                }
            });
        };
    }, [model, setGenerator, visMode]);

    const steps = useMemo<AnimationStep[]>(() => {
        if (!model) return [];
        return visMode === 'inference' ? inferenceSteps(model.config) : trainingSteps(model.config);
    }, [model, visMode]);

    // Hook into the trainer
    useEffect(() => {
        if (trainer) {
            const hStart = () => {
                setVisMode('training');
            };
            trainer.on('start', hStart);

            return () => {
                trainer.off('start', hStart);
            };
        }
    }, [trainer, steps, setVisMode]);

    useEffect(() => {
        setStep(steps[0] ?? null);
    }, [steps]);

    const ready = !!model;

    return (
        <div className="sidePanel">
            <h2>{t('tools.trainingProcess')}</h2>
            <ModelControls
                disabled={!ready || modelStatus === 'training' || modelStatus === 'busy'}
                steps={steps}
                onStepChange={setStep}
                generator={generator}
                visMode={visMode}
                setVisMode={setVisMode}
            />
            {visMode === 'inference' ? (
                <Inference
                    generator={generator}
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
    );
}
