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

export interface IDBTokenManifest {
    tokeniserId: string;
    datasetId: string;
    shards: number;
}

export async function getData() {
    const manifest: IDBTokenManifest | undefined = await get('dataTokens_manifest');
    if (!manifest) {
        return null;
    }
    const existingTokens: Uint16Array[] | undefined = [];
    for (let i = 0; i < manifest.shards; i++) {
        const shard: Uint16Array | undefined = await get(`dataTokens_shard_${i}`);
        if (shard) {
            existingTokens.push(shard);
        }
    }

    if (existingTokens.length === manifest.shards) {
        return {
            tokens: existingTokens,
            tokeniserId: manifest.tokeniserId,
            datasetId: manifest.datasetId,
        };
    }

    return null;
}

export async function deleteData() {
    const manifest: IDBTokenManifest | undefined = await get('dataTokens_manifest');
    if (manifest) {
        for (let i = 0; i < manifest.shards; i++) {
            await del(`dataTokens_shard_${i}`);
        }
        await del('dataTokens_manifest');
    }
}
