import { TrainingLogEntry } from '@genai-fi/nanogpt';
import { EvaluationMetric } from '../state/evaluatorSettings';

export function createMetric(
    metric: EvaluationMetric,
    log: Partial<TrainingLogEntry>,
    vocabSize: number
): { value: number; percentage: number } {
    const maxLoss = Math.log(vocabSize);
    let percentage = Math.max(
        0,
        Math.min(1, (maxLoss - (log.validationMetrics?.loss ?? log.trainingMetrics?.loss ?? 0)) / maxLoss)
    );

    switch (metric) {
        case 'loss':
            return { value: log.validationMetrics?.loss ?? log.trainingMetrics?.loss ?? 0, percentage };
        case 'perplexity':
            return { value: log.validationMetrics?.perplexity ?? log.trainingMetrics?.perplexity ?? 0, percentage };
        case 'gradientNorm':
            percentage = log.gradientNorm ? Math.max(0, Math.min(1, 1 - log.gradientNorm / 100)) : 0;
            return { value: log.gradientNorm ?? 0, percentage };
        case 'accuracy':
            return { value: log.validationMetrics?.accuracy ?? log.trainingMetrics?.accuracy ?? 0, percentage };
        default:
            return { value: 0, percentage };
    }
}
