import { useAtomValue } from 'jotai';
import { modelAtom } from '../../state/model';
import { checks, TeachableLLM, TensorStatistics } from '@genai-fi/nanogpt';
import { BusyButton } from '@genai-fi/base';
import { useState } from 'react';
import useModelLoaded from '../../utilities/useModelLoaded';
import { squeezeArray } from '../../utilities/arrays';

async function debugModel(model: TeachableLLM) {
    // Generate text with logits output
    const generator = model.generator();
    await generator.generate(undefined, {
        embeddings: 'all',
        maxLength: 50,
    });

    const logitsData = generator.getEmbeddingsData()[0];

    // Create stats on logits
    const statsPromise = logitsData.map((stepLogits: { name: string; tensor: number[][] }) =>
        checks.createWeightStatistics(squeezeArray(stepLogits.tensor) as number[])
    );
    const stats = await Promise.all(statsPromise);
    return stats.map((stat, index) => ({
        name: logitsData[index].name,
        ...stat,
    }));
}

interface NamedTensorStatistics extends TensorStatistics {
    name: string;
}

export function Component() {
    const model = useAtomValue(modelAtom);
    const [running, setRunning] = useState(false);
    const [stats, setStats] = useState<NamedTensorStatistics[]>([]);
    const ready = useModelLoaded(model ?? undefined);

    return (
        <div className="sidePanel">
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
                        <strong>Step {stat.name}:</strong> <pre>{JSON.stringify(stat, null, 2)}</pre>
                    </li>
                ))}
            </ul>
        </div>
    );
}
