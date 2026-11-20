import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
    vi.resetModules();
    sessionStorage.clear();
    localStorage.clear();
    window.history.replaceState({}, '', '/');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 547 }) }));
    vi.stubEnv('VITE_XAPI_ID_ENDPOINT', 'https://api.test/xapi/unique');
    vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
});

describe('research session identification', () => {
    it('does nothing without research mode, but can initialize when the link first appears', async () => {
        const service = await import('./identity');
        expect(await service.initializeResearchIdentity()).toBeNull();
        expect(fetch).not.toHaveBeenCalled();
        window.history.replaceState({}, '', '/?log=study');
        expect(await service.initializeResearchIdentity()).toMatchObject({ actorId: 'study-547' });
    });

    it('allocates once and remembers both IDs after navigation and refresh', async () => {
        window.history.replaceState({}, '', '/?log=study');
        const service = await import('./identity');
        const [first, second] = await Promise.all([
            service.initializeResearchIdentity(),
            service.initializeResearchIdentity(),
        ]);
        expect(first).toBe(second);
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith('https://api.test/xapi/unique', {
            cache: 'no-store',
            signal: expect.any(AbortSignal),
        });
        expect(sessionStorage.getItem('llm-xapi-session')).toBe('study');
        expect(sessionStorage.getItem('llm-xapi-identity-v1:study')).toBe('547');
        expect(localStorage.length).toBe(0);
        window.history.replaceState({}, '', '/workspace/home');
        expect(service.getResearchIdentity()).toEqual(first);
        vi.resetModules();
        const restored = await import('./identity');
        expect(await restored.initializeResearchIdentity()).toEqual(first);
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('uses a new explicit study parameter on a fresh page and keeps assignments separate', async () => {
        sessionStorage.setItem('llm-xapi-session', 'study-A');
        sessionStorage.setItem('llm-xapi-identity-v1:study-A', '1');
        window.history.replaceState({}, '', '/?log=study-B');
        const service = await import('./identity');
        expect(await service.initializeResearchIdentity()).toMatchObject({ actorId: 'study-B-547' });
        expect(sessionStorage.getItem('llm-xapi-identity-v1:study-A')).toBe('1');
    });

    it.each([-1, 1.2, '547', null])(
        'rejects an invalid participant number %s without automatic setup retries',
        async (id) => {
            window.history.replaceState({}, '', '/?log=study');
            vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ id }) } as Response);
            const service = await import('./identity');
            expect(await service.initializeResearchIdentity()).toBeNull();
            expect(await service.initializeResearchIdentity()).toBeNull();
            expect(fetch).toHaveBeenCalledTimes(1);
            expect(sessionStorage.getItem('llm-xapi-identity-v1:study')).toBeNull();
        }
    );

    it('does not allocate if session storage cannot save the study', async () => {
        window.history.replaceState({}, '', '/?log=study');
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('Storage blocked');
        });
        const service = await import('./identity');
        expect(await service.initializeResearchIdentity()).toBeNull();
        expect(fetch).not.toHaveBeenCalled();
    });
});
