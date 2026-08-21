import { IGeneratorResponse, utilities } from '@genai-fi/nanogpt';
import { reduceAttention } from './attention';

export function splitResponse(response: IGeneratorResponse): {
    text: string;
    predictions: number[][];
    attention: number[][];
    token: number | null;
    multinomialRand: number;
    loss: number | null;
} {
    const conversation = response.output ?? [];
    const text = conversation ? conversation[conversation.length - 1]?.content || '' : '';

    const lastConversation = conversation ? conversation[conversation.length - 1]?._output || [] : [];
    const lastOutput = lastConversation.length > 0 ? lastConversation[lastConversation.length - 1] : null;

    const attentionData = lastOutput?.attention;

    const rawEmbeddingData = lastOutput?.hiddenStates;
    if (rawEmbeddingData && rawEmbeddingData.length > 0) {
        const embeddingData = rawEmbeddingData.slice();
        embeddingData[embeddingData.length - 1] = lastOutput?.scores ?? [];
    }

    return {
        text,
        predictions: rawEmbeddingData ? rawEmbeddingData.map((e) => utilities.topP([e], 0.9)) : [],
        attention: attentionData ? reduceAttention(attentionData) : [],
        token: lastOutput?.token ?? null,
        multinomialRand: lastOutput?.multinomialRand ?? 0,
        loss: lastOutput?.loss ?? null,
    };
}
