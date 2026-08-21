import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Conversation, TeachableLLM } from '@genai-fi/nanogpt';
import ChatManager from './ChatManager';
import { waitFor } from '@testing-library/react';
import EE from 'eventemitter3';

async function flushPromises() {
    await Promise.resolve();
    await Promise.resolve();
}

describe('ChatManager', () => {
    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('should handle peer connections and messages', () => {});

    it('sends responses for a single chat request', async () => {
        const ee = new EE();
        const model = {
            responses: {
                create: vi.fn(async () => {
                    setTimeout(() => ee.emit('done', 'test-response'), 10);
                    return {
                        id: 'test-response',
                        output: [{ role: 'assistant', content: 'hello from model' }] as Conversation[],
                    };
                }),
                on: vi.fn((event: string, callback: (message: string) => void) => {
                    ee.addListener(event, callback);
                }),
                off: vi.fn((event: string, callback: (message: string) => void) => {
                    ee.removeListener(event, callback);
                }),
            },
            on: vi.fn(),
            off: vi.fn(),
        } as unknown as TeachableLLM;

        const manager = new ChatManager(model);
        const onUpdate = vi.fn();
        const onError = vi.fn();

        manager.startConversation('chat-1', 'Hi there', onUpdate, onError);
        await flushPromises();

        await waitFor(() => expect(model.responses.create).toHaveBeenCalledTimes(1));
        expect(onError).not.toHaveBeenCalled();
        await waitFor(() => expect(onUpdate).toHaveBeenCalled());

        const lastCall = onUpdate.mock.calls[onUpdate.mock.calls.length - 1];
        expect(lastCall).toEqual(['test-response', 'hello from model', true]);
    });
});
