import type { Statement } from '@xapi/xapi';
import { v4 as uuidv4 } from 'uuid';
import { getResearchIdentity } from './identity';

const requestTimeout = 15000;

let recording: Recording | null = null;
let sending = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

// One statement waiting for delivery.
interface QueueEntry {
    statement: Statement;
    attempts: number;
    retryAt: number;
    failed: boolean;
    error: string | null;
}

// Current page recording and unsent events.
interface Recording {
    sessionId: string;
    sequence: number;
    queue: QueueEntry[];
}

class ProxyDeliveryError extends Error {
    constructor(
        message: string,
        public readonly retryable: boolean
    ) {
        super(message);
        this.name = 'ProxyDeliveryError';
    }
}

// Send one statement without browser-side LRS credentials.
async function sendToProxy(statement: Statement): Promise<void> {
    const endpoint = import.meta.env.VITE_XAPI_PROXY_ENDPOINT?.trim();
    if (!endpoint) {
        throw new ProxyDeliveryError('Missing VITE_XAPI_PROXY_ENDPOINT.', false);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), requestTimeout);

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            credentials: 'omit',
            headers: {
                'Content-Type': 'application/json',
                'X-Experience-API-Version': '1.0.3',
            },
            body: JSON.stringify(statement),
            signal: controller.signal,
        });

        if (!response.ok) {
            const retryable = response.status === 408 || response.status === 429 || response.status >= 500;
            throw new ProxyDeliveryError(`Proxy returned HTTP ${response.status}.`, retryable);
        }
    } catch (error) {
        if (error instanceof ProxyDeliveryError) throw error;

        throw new ProxyDeliveryError(
            controller.signal.aborted ? 'Proxy request timed out.' : 'Network or browser request failed.',
            true
        );
    } finally {
        clearTimeout(timeout);
    }
}

// Keep one recording in memory for this page.
export function getRecording(): Recording {
    if (!getResearchIdentity()) throw new Error('Research identification is not ready.');

    if (!recording) {
        recording = { sessionId: uuidv4(), sequence: 0, queue: [] };
    }

    return recording;
}

// Deliver queued statements without changing their IDs.
export async function flushQueue(): Promise<void> {
    if (sending || !getResearchIdentity()) return;

    if (retryTimer) clearTimeout(retryTimer);
    retryTimer = null;
    sending = true;
    const state = getRecording();

    try {
        for (const entry of [...state.queue]) {
            if (entry.failed || entry.retryAt > Date.now()) continue;

            entry.attempts += 1;

            try {
                await sendToProxy(entry.statement);
                state.queue.splice(state.queue.indexOf(entry), 1);
            } catch (error) {
                entry.failed = error instanceof ProxyDeliveryError && !error.retryable;
                entry.error = error instanceof ProxyDeliveryError ? error.message : 'Proxy delivery failed.';
                entry.retryAt = Date.now() + Math.min(60000, 1000 * 2 ** Math.min(entry.attempts, 6));
                console.error('[xAPI] Delivery failed:', {
                    statementId: entry.statement.id,
                    error: entry.error,
                });
            }
        }
    } finally {
        sending = false;

        if (getResearchIdentity()) {
            const waiting = state.queue.filter((entry) => !entry.failed);
            if (waiting.length > 0) {
                retryTimer = setTimeout(
                    () => {
                        void flushQueue();
                    },
                    Math.max(0, Math.min(...waiting.map((entry) => entry.retryAt)) - Date.now())
                );
            }
        }
    }
}

// Retry pending and failed submissions.
export function retryXapiDelivery(): void {
    if (!getResearchIdentity()) return;

    for (const entry of getRecording().queue) {
        entry.failed = false;
        entry.retryAt = 0;
    }

    void flushQueue();
}
