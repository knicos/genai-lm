import { useAtomValue } from 'jotai';
import style from './style.module.css';
import { modelAtom } from '../../state/model';
import { checks, TeachableLLM, TensorStatistics } from '@genai-fi/nanogpt';
import { BusyButton } from '@genai-fi/base';
import { useState } from 'react';
import { squeezeArray } from '../../utilities/arrays';
import useModelLoaded from '../../utilities/useModelLoaded';

async function debugModel(model: TeachableLLM) {
    // Generate text with logits output
    const generator = model.generator();
    await generator.generate(undefined, {
        embeddings: true,
        maxLength: 50,
    });

    const logitsData = squeezeArray(generator.getEmbeddingsData()[0]) as number[][];

    // Create stats on logits
    const statsPromise = logitsData.map((stepLogits: number[]) => checks.createWeightStatistics(stepLogits));
    const stats = await Promise.all(statsPromise);
    return stats;
}

export function Component() {
    const model = useAtomValue(modelAtom);
    const [running, setRunning] = useState(false);
    const [stats, setStats] = useState<TensorStatistics[]>([]);
    const ready = useModelLoaded(model ?? undefined);

    return (
        <div className={style.column}>
            <h2>Model Debugger</h2>
            <BusyButton
                disabled={!model || !ready}
                busy={running}
                variant="contained"
                color="primary"
                onClick={() => {
                    debugModel(model!).then((stats) => {
                        setStats(stats);
                        setRunning(false);
                    });
                    setRunning(true);
                }}
            >
                Debug Model
            </BusyButton>
            <ul>
                {stats.map((stat, index) => (
                    <li key={index}>
                        <strong>Step {index + 1}:</strong> <pre>{JSON.stringify(stat, null, 2)}</pre>
                    </li>
                ))}
            </ul>
        </div>
    );
}
