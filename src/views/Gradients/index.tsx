import { useAtomValue, useSetAtom } from 'jotai';
import { modelAtom } from '../../state/model';
import { TensorStatistics, TrainingLogEntry } from '@genai-fi/nanogpt';
import { useEffect, useState } from 'react';
import { trainerSettings } from '../../state/trainer';

export function Component() {
    const model = useAtomValue(modelAtom);
    const [stats, setStats] = useState<Map<string, TensorStatistics> | null>(null);
    const setTrainerSettings = useSetAtom(trainerSettings);

    useEffect(() => {
        // Enable gradient metrics in trainer settings
        setTrainerSettings((settings) => ({
            ...settings,
            gradientMetrics: true,
        }));
        return () => {
            // Disable gradient metrics when unmounting
            setTrainerSettings((settings) => ({
                ...settings,
                gradientMetrics: false,
            }));
        };
    }, [setTrainerSettings]);

    useEffect(() => {
        if (model) {
            const h = (log: TrainingLogEntry) => {
                if (log.gradientMetrics) {
                    setStats(log.gradientMetrics);
                }
            };
            model.on('trainStep', h);

            return () => {
                model.off('trainStep', h);
            };
        }
    }, [model]);

    return (
        <div className="sidePanel">
            <h2>Gradients</h2>
            <ul>
                {stats &&
                    Array.from(stats.entries()).map(([name, stat], index) => (
                        <li key={index}>
                            <strong>Step {name}:</strong> <pre>{JSON.stringify(stat, null, 2)}</pre>
                        </li>
                    ))}
            </ul>
        </div>
    );
}
