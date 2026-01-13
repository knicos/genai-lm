import { Conversation } from '@genai-fi/nanogpt';

export interface ExtendedConversation extends Conversation {
    originalIndex?: number;
    injected?: boolean;
    _completed?: boolean;
}
