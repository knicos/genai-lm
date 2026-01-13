import { Conversation } from '@genai-fi/nanogpt';

export function flattenConversation(conversation: Conversation[]): string {
    return conversation.map((part) => part.content).join('\n\n');
}

export function sequencesToConversation(sequences: string[], mode: 'assistant' | 'fsau'): Conversation[][] {
    if (mode === 'assistant') {
        return sequences.map((text) => [{ role: 'assistant', content: text }]);
    } else {
        // FSAU: First sentence is user, rest is assistant
        return sequences.map((text) => {
            const parts = text.split('. ');
            if (parts.length === 0) {
                return [];
            }
            const first = parts.shift()!;
            const rest = parts.join('. ');
            const conversation: Conversation[] = [{ role: 'user', content: first + (parts.length > 0 ? '.' : '') }];
            if (rest.length > 0) {
                conversation.push({ role: 'assistant', content: rest });
            }
            return conversation;
        });
    }
}
