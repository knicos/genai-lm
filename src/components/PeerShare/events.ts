import { PeerEvent } from '@genai-fi/base';
import { Conversation } from '@genai-fi/nanogpt';

export interface ChatEvent extends PeerEvent {
    event: 'chat';
    input: Conversation[] | string;
    conversation?: string; // Optional conversation ID for context management
    stream?: boolean; // Optional flag to indicate if the response should be streamed
}

export interface ResponseEvent extends PeerEvent {
    event: 'response';
    output: Conversation;
    completed: boolean;
    conversation: string;
}

export interface ErrorEvent extends PeerEvent {
    event: 'error';
    message: string;
}

export type EventProtocol = ChatEvent | ResponseEvent | ErrorEvent;
