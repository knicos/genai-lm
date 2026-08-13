import { delOPFS, set, get, del, getOPFSBlob, setOPFSBlob } from '../state/storage';

export async function getCheckpoint() {
    return getOPFSBlob('model_checkpoint');
}

export async function setCheckpoint(file: File) {
    await setOPFSBlob('model_checkpoint', file);
}

export async function deleteCheckpoint() {
    await delOPFS('model_checkpoint');
}

export interface IDBTokenManifest {
    tokeniserId: string;
    datasetId: string;
}

export function setData(tokeniserId: string, datasetId: string) {
    const manifest: IDBTokenManifest = {
        tokeniserId,
        datasetId,
    };

    set('dataTokens_manifest', manifest);
}

export function getData() {
    const manifest: IDBTokenManifest | null = get('dataTokens_manifest');
    if (!manifest) {
        return null;
    }

    return {
        tokeniserId: manifest.tokeniserId,
        datasetId: manifest.datasetId,
    };
}

export function deleteData() {
    const manifest: IDBTokenManifest | null = get('dataTokens_manifest');
    if (manifest) {
        del('dataTokens_manifest');
    }
}
