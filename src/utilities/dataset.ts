import { ConversationStream } from '@genai-fi/nanogpt';
import { DataEntry } from '../state/data';

export async function createDatasetFromEntries(entries: DataEntry[]): Promise<ConversationStream[]> {
    const flatContent = await Promise.all(entries.map((entry) => entry.stream));
    return flatContent.flat(1);
}
