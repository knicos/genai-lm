import { createDatasetFromEntries } from '../../utilities/dataset';
import { tokenise, TeachableLLM } from '@genai-fi/nanogpt';
import type { DataEntry, DataTokens } from '../../state/data';
import { setCheckpoint } from '../../utilities/db';
import { TrainingSettings } from '../../state/trainer';

const { tokensFromStreams } = tokenise;

export async function autoTokeniseData(
    entries: DataEntry[],
    model: TeachableLLM,
    datasetId: string
): Promise<{ trainingTokens: DataTokens; validationTokens?: DataTokens }> {
    const conversations = await createDatasetFromEntries(entries);

    if (!model.tokeniser.trained) {
        await model.tokeniser.train(conversations, undefined, datasetId);
    }

    const newTokens = await tokensFromStreams(conversations, model.tokeniser, datasetId, {
        validationSplit: 0.1,
    });

    return {
        trainingTokens: { tokens: newTokens.trainingTokens, tokeniserId: model.tokeniser.id, datasetId },
        validationTokens: newTokens.validationTokens
            ? { tokens: newTokens.validationTokens, tokeniserId: model.tokeniser.id, datasetId }
            : undefined,
    };
}

export async function saveCheckpoint(model: TeachableLLM) {
    try {
        // Save checkpoint
        const blob = await model.saveModel({
            name: model.meta.name ?? 'model_checkpoint',
            includeOptimizer: true,
        });
        const file = new File([blob], `model_checkpoint.zip`, { type: 'application/zip' });
        await setCheckpoint(file);
    } catch (err) {
        console.error('Error saving checkpoint', err);
    }
}

const CHECKPT_THRESHOLD = 3_000_000;

export function configureModelForTraining(model: TeachableLLM, settings: TrainingSettings) {
    const modelSize = model.getNumParams();
    const useCheckpointing = modelSize > CHECKPT_THRESHOLD && !settings.disableCheckpointing;
    settings.gradientCheckpointing = useCheckpointing;

    // Partial fine tune, limit the variables to the last layers and the embedding layer
    if (settings.limitLayers !== undefined && settings.limitLayers > 0) {
        settings.trainableWeights = ['token_embedding'];
        for (let i = 0; i < settings.limitLayers; i++) {
            settings.trainableWeights.push(`block_${model.config.nLayer - 1 - i}_*`);
        }
    } else {
        settings.trainableWeights = undefined;
    }
}
