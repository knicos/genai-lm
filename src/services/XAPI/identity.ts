export interface ResearchIdentity {
    researchSessionId: string;
    participantNumber: number;
    actorId: string;
}

const sessionKey = 'llm-xapi-session';
const identityPrefix = 'llm-xapi-identity-v1:';
let identity: ResearchIdentity | null = null;
let initialization: Promise<ResearchIdentity | null> | null = null;

// Return the identity already initialized for this page.
export function getResearchIdentity(): ResearchIdentity | null {
    return identity;
}

// Restore research mode across navigation and refresh within this tab.
export function getResearchSessionId(): string | null {
    return new URLSearchParams(window.location.search).get('log')?.trim() || sessionStorage.getItem(sessionKey);
}

// Allocate once, without putting participant setup logic in components.
export function initializeResearchIdentity(): Promise<ResearchIdentity | null> {
    if (initialization) return initialization;

    try {
        if (!getResearchSessionId()) return Promise.resolve(null);
    } catch (error) {
        console.error('[xAPI] Session storage unavailable:', error);
        return Promise.resolve(null);
    }

    initialization = assignIdentity();
    return initialization;
}

// Save the session and participant before enabling research logging.
async function assignIdentity(): Promise<ResearchIdentity | null> {
    try {
        const researchSessionId = getResearchSessionId();
        if (!researchSessionId) return null;

        sessionStorage.setItem(sessionKey, researchSessionId);
        const key = `${identityPrefix}${encodeURIComponent(researchSessionId)}`;
        const saved = sessionStorage.getItem(key);
        let participantNumber: unknown = saved === null ? undefined : JSON.parse(saved);

        if (saved === null) {
            const endpoint = import.meta.env.VITE_XAPI_ID_ENDPOINT?.trim();
            if (!endpoint) throw new Error('Missing participant allocation endpoint.');

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000);

            try {
                const response = await fetch(endpoint, {
                    cache: 'no-store',
                    signal: controller.signal,
                });
                if (!response.ok) throw new Error(`Participant allocation returned HTTP ${response.status}.`);
                const body: unknown = await response.json();
                participantNumber = body && typeof body === 'object' && 'id' in body ? body.id : undefined;
            } finally {
                clearTimeout(timeout);
            }
        }

        if (
            typeof participantNumber !== 'number' ||
            !Number.isSafeInteger(participantNumber) ||
            participantNumber < 0
        ) {
            throw new Error('Invalid participant number.');
        }

        sessionStorage.setItem(key, JSON.stringify(participantNumber));
        identity = { researchSessionId, participantNumber, actorId: `${researchSessionId}-${participantNumber}` };
        return identity;
    } catch (error) {
        console.error('[xAPI] Identification unavailable:', error instanceof Error ? error.message : String(error));
        return null;
    }
}
