import { Conversation } from '@genai-fi/nanogpt';

interface ExtendedBase {
    _completed?: boolean;
}

export type ExtendedMessage = Conversation & ExtendedBase;

interface StatusMessage extends ExtendedBase {
    role: 'status';
    content: string;
    level: 'info' | 'warning' | 'error';
}

interface InjectedUserMessage extends ExtendedBase {
    role: 'auto_user';
    content: string;
}

export type ExtendedConversation = ExtendedMessage | StatusMessage | InjectedUserMessage;
