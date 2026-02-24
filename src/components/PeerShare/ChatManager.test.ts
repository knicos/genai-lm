import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Conversation, TeachableLLM } from '@genai-fi/nanogpt';
import ChatManager from './ChatManager';
import { waitFor } from '@testing-library/react';

interface Deferred<T> {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (reason?: unknown) => void;
}

function createDeferred<T>(): Deferred<T> {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

function createMockGenerator(options?: {
    finalContent?: string;
    deferred?: Deferred<Conversation[]>;
    emitFiveTokenEvent?: boolean;
}) {
    let tokensHandler: (() => void) | undefined;
    const partialContent = 'partial response';
    const finalContent = options?.finalContent ?? 'final response';

    return {
        on: vi.fn((event: string, cb: () => void) => {
            if (event === 'tokens') tokensHandler = cb;
        }),
        getConversation: vi.fn(() => [{ role: 'assistant', content: partialContent }] as Conversation[]),
        generate: vi.fn(async () => {
            if (options?.emitFiveTokenEvent && tokensHandler) {
                for (let i = 0; i < 5; i++) tokensHandler();
            }

            if (options?.deferred) return options.deferred.promise;
            return [{ role: 'assistant', content: finalContent }] as Conversation[];
        }),
        stop: vi.fn(),
        dispose: vi.fn(),
    };
}

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
        const generator = createMockGenerator({
            finalContent: 'hello from model',
            emitFiveTokenEvent: true,
        });

        const model = {
            generator: vi.fn(() => generator),
        } as unknown as TeachableLLM;

        const manager = new ChatManager(model);
        const onUpdate = vi.fn();
        const onError = vi.fn();

        manager.startConversation('chat-1', 'Hi there', onUpdate, onError);
        await flushPromises();

        await waitFor(() => expect(model.generator).toHaveBeenCalledTimes(1));
        expect(onError).not.toHaveBeenCalled();
        expect(onUpdate).toHaveBeenCalled();

        const lastCall = onUpdate.mock.calls[onUpdate.mock.calls.length - 1];
        expect(lastCall).toEqual(['chat-1', 'hello from model', true]);
    });

    it('queues multiple chats and processes them one at a time in order', async () => {
        vi.useFakeTimers();

        const firstDeferred = createDeferred<Conversation[]>();
        const secondDeferred = createDeferred<Conversation[]>();

        const gen1 = createMockGenerator({ deferred: firstDeferred });
        const gen2 = createMockGenerator({ deferred: secondDeferred });

        const model = {
            generator: vi
                .fn()
                .mockImplementationOnce(() => gen1)
                .mockImplementationOnce(() => gen2),
        } as unknown as TeachableLLM;

        const manager = new ChatManager(model);
        const onUpdate = vi.fn();
        const onError = vi.fn();

        manager.startConversation('chat-1', 'First', onUpdate, onError);
        manager.startConversation('chat-2', 'Second', onUpdate, onError);

        await flushPromises();

        // Expected behavior: only first should start immediately.
        expect(model.generator).toHaveBeenCalledTimes(1);

        firstDeferred.resolve([{ role: 'assistant', content: 'first done' }] as Conversation[]);
        await flushPromises();

        vi.runOnlyPendingTimers();
        await flushPromises();

        expect(model.generator).toHaveBeenCalledTimes(2);

        secondDeferred.resolve([{ role: 'assistant', content: 'second done' }] as Conversation[]);
        await flushPromises();

        vi.runOnlyPendingTimers();
        await flushPromises();

        expect(onError).not.toHaveBeenCalled();

        const completedCalls = onUpdate.mock.calls.filter((c) => c[2] === true);
        expect(completedCalls[0]).toEqual(['chat-1', 'first done', true]);
        expect(completedCalls[1]).toEqual(['chat-2', 'second done', true]);
    });
});
