import { Conversation } from '@genai-fi/nanogpt';
import { DataEntry } from '../state/data';

export async function createDatasetFromEntries(entries: DataEntry[]): Promise<Conversation[][]> {
    const flatContent = await Promise.all(entries.map((entry) => entry.content));
    return flatContent.flat(1);
}
