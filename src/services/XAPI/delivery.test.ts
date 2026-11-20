import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Statement } from '@xapi/xapi';

beforeEach(async () => {
    vi.resetModules();
    vi.doUnmock('./delivery');
    sessionStorage.clear();
    localStorage.clear();
    window.history.replaceState({}, '', '/?log=study');
    sessionStorage.setItem('llm-xapi-identity-v1:study', '547');
    await (await import('./identity')).initializeResearchIdentity();
    vi.stubEnv('VITE_XAPI_PROXY_ENDPOINT', 'https://api.test/xapi/statements');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));
    vi.useFakeTimers();
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
});

async function queued() {
    const delivery = await import('./delivery');
    const statement: Statement = {
        id: crypto.randomUUID(),
        actor: { account: { homePage: 'https://lm.gen-ai.fi/xapi', name: 'study-547' } },
        verb: { id: 'https://lm.gen-ai.fi/xapi/verbs/clicked' },
        object: { id: 'https://lm.gen-ai.fi/xapi/activities/alternatives-tool' },
    };
    delivery.getRecording().queue.push({ statement, attempts: 0, retryAt: 0, failed: false, error: null });
    return { delivery, statement };
}

describe('in-memory proxy delivery', () => {
    it('sends raw JSON without credentials and removes acknowledged statements', async () => {
        const { delivery, statement } = await queued();
        await delivery.flushQueue();
        expect(fetch).toHaveBeenCalledWith(
            'https://api.test/xapi/statements',
            expect.objectContaining({
                method: 'POST',
                credentials: 'omit',
                body: JSON.stringify(statement),
                headers: { 'Content-Type': 'application/json', 'X-Experience-API-Version': '1.0.3' },
            })
        );
        expect(delivery.getRecording().queue).toHaveLength(0);
        expect(localStorage.length).toBe(0);
    });

    it.each([408, 429, 500])('retains and retries HTTP %s with the same UUID', async (status) => {
        const { delivery, statement } = await queued();
        vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status } as Response);
        await delivery.flushQueue();
        expect(delivery.getRecording().queue).toHaveLength(1);
        await vi.advanceTimersByTimeAsync(2000);
        expect(fetch).toHaveBeenCalledTimes(2);
        for (const [, options] of vi.mocked(fetch).mock.calls) {
            expect(JSON.parse(String(options?.body)).id).toBe(statement.id);
        }
        expect(delivery.getRecording().queue).toHaveLength(0);
    });

    it('retains permanent rejections without an automatic retry loop', async () => {
        const { delivery } = await queued();
        vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 400 } as Response);
        await delivery.flushQueue();
        await vi.advanceTimersByTimeAsync(60000);
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(delivery.getRecording().queue[0].failed).toBe(true);
    });

    it('retries a network failure with the same statement', async () => {
        const { delivery, statement } = await queued();
        vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'));

        await delivery.flushQueue();
        expect(delivery.getRecording().queue).toHaveLength(1);
        expect(localStorage.length).toBe(0);

        await vi.advanceTimersByTimeAsync(2000);
        expect(fetch).toHaveBeenCalledTimes(2);
        expect(JSON.parse(String(vi.mocked(fetch).mock.calls[1][1]?.body))).toEqual(statement);
        expect(delivery.getRecording().queue).toHaveLength(0);
    });

    it('starts a new empty recording after refresh while preserving participant identity', async () => {
        const { delivery } = await queued();
        const recordingId = delivery.getRecording().sessionId;
        delivery.getRecording().sequence = 3;

        window.history.replaceState({}, '', '/workspace/home');
        vi.resetModules();
        const identity = await (await import('./identity')).initializeResearchIdentity();
        const restored = await import('./delivery');

        expect(identity?.actorId).toBe('study-547');
        expect(restored.getRecording().sessionId).not.toBe(recordingId);
        expect(restored.getRecording().sequence).toBe(0);
        expect(restored.getRecording().queue).toHaveLength(0);
        await restored.flushQueue();
        expect(fetch).not.toHaveBeenCalled();
    });

    it('delivers without accessing browser storage after identification', async () => {
        const { delivery } = await queued();
        const read = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('Storage blocked');
        });
        const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('Quota exceeded');
        });

        await delivery.flushQueue();
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(delivery.getRecording().queue).toHaveLength(0);
        expect(read).not.toHaveBeenCalled();
        expect(write).not.toHaveBeenCalled();
    });

    it('does not send the same queue concurrently', async () => {
        const { delivery } = await queued();
        let finish: (value: Response) => void = () => {};
        vi.mocked(fetch).mockImplementationOnce(
            () =>
                new Promise((resolve) => {
                    finish = resolve;
                })
        );
        const first = delivery.flushQueue();
        await delivery.flushQueue();
        expect(fetch).toHaveBeenCalledTimes(1);
        finish({ ok: true, status: 200 } as Response);
        await first;
    });

    it('does not send without an active study identity', async () => {
        await queued();
        sessionStorage.clear();
        window.history.replaceState({}, '', '/');
        vi.resetModules();
        await (await import('./delivery')).flushQueue();
        expect(fetch).not.toHaveBeenCalled();
    });
});
