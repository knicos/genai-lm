import { get, set, del } from 'idb-keyval';

export function getCheckpoint() {
    return get('model_checkpoint');
}

export async function setCheckpoint(file: File) {
    await set('model_checkpoint', file);
}

export async function deleteCheckpoint() {
    await del('model_checkpoint');
}

export async function getData() {
    const existingTokens: Uint16Array | undefined = await get('dataTokens_tokens');
    const existingTokeniserId: string | undefined = await get('dataTokens_tokeniserId');
    const existingDatasetId: string | undefined = await get('dataTokens_datasetId');

    if (existingTokens && existingTokeniserId && existingDatasetId) {
        return {
            tokens: existingTokens,
            tokeniserId: existingTokeniserId,
            datasetId: existingDatasetId,
        };
    }

    return null;
}

export async function deleteData() {
    await del('dataTokens_tokens');
    await del('dataTokens_tokeniserId');
    await del('dataTokens_datasetId');
}
