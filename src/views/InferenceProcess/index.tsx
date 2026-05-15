import { useAtom, useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';
import { modelAtom } from '../../state/model';
import { useEffect, useMemo, useState } from 'react';
import useModelLoaded from '../../hooks/useModelLoaded';
import ModelControls, { AnimationStep } from './ModelControls';
import { rawGeneratorAtom } from '../../state/generator';
import VirtualGenerator from './VirtualGenerator';
import { resetGeneratorFactory, setGeneratorFactory } from '../../utilities/generatorFactory';
import { Inference } from './Inference';
import { Training } from './Training';
import { trainerAtom } from '../../state/trainer';
import { inferenceSteps, trainingSteps } from './animationSteps';
import useQueryState from '../../hooks/useQueryState';

export function Component() {
    const { t } = useTranslation();
    const model = useAtomValue(modelAtom);
    const loaded = useModelLoaded(model ?? undefined);
    const [generator, setGenerator] = useAtom(rawGeneratorAtom);
    const trainer = useAtomValue(trainerAtom);
    const [visMode, setVisMode] = useQueryState<'training' | 'inference'>('vismode', 'inference');
    const [step, setStep] = useState<AnimationStep | null>(null);

    // Hook into the generator
    useEffect(() => {
        setGeneratorFactory((model) => {
            return new VirtualGenerator(model);
        });
        setGenerator((old) => {
            if (old && model && model.loaded) {
                old.dispose();
                const virtualGen = new VirtualGenerator(model);

                virtualGen.on('start', () => {
                    setVisMode('inference');
                });

                return virtualGen;
            }
            return old;
        });

        return () => {
            resetGeneratorFactory();
        };
    }, [model, setGenerator, setVisMode]);

    const steps = useMemo<AnimationStep[]>(() => {
        if (!model || !loaded) return [];
        return visMode === 'inference' ? inferenceSteps(model.config) : trainingSteps(model.config);
    }, [model, loaded, visMode]);

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

    const ready = model && loaded;

    return (
        <div className="sidePanel">
            <h2>{t('tools.trainingProcess')}</h2>
            <ModelControls
                disabled={!ready}
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
                    loaded={loaded}
                />
            ) : (
                <Training
                    model={model}
                    loaded={loaded}
                    step={step}
                />
            )}
        </div>
    );
}
