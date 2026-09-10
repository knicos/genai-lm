import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export const uiShowSettings = atom(false);
export const uiShowVisualisation = atom(false);
export const uiShowSidePanel = atom(false);
export const uiDeveloperMode = atomWithStorage('uiDeveloperMode', false);
export const uiCompactMode = atomWithStorage('uiCompactMode', false);
export const uiFatalError = atom(false);
export const uiTokenSelectLength = atom<number>(0);
export const uiAuditOutput = atom(false);
export const uiTokenHighlightMode = atom<'none' | 'confidence' | 'score'>('none');

export interface TokenSelectState {
    startToken: number;
    endToken: number;
    conversationIndex: number;
    // conversation: Conversation[];
}

export const uiSelectedTokens = atom<TokenSelectState | null>(null);

interface FeatureFlags {
    allowReportProblem?: boolean;
    allowAudit?: boolean;
}

function applyFeatureOverridesFromUrl(features: FeatureFlags): FeatureFlags {
    const params = new URLSearchParams(window.location.search);
    const patched = { ...features };

    for (const [key, raw] of params.entries()) {
        if (!(key in patched)) continue;
        const v = raw?.toLowerCase();

        if (v === 'true' || v === '1') {
            patched[key as keyof FeatureFlags] = true;
        } else if (v === 'false' || v === '0') {
            patched[key as keyof FeatureFlags] = false;
        } else if (v === '' || v === 'on') {
            patched[key as keyof FeatureFlags] = true;
        }
    }

    return patched;
}

export const featureFlagsAtom = atom(async () => {
    try {
        const isStagingEnv = !window.location.hostname.endsWith('gen-ai.fi');
        const response = await fetch(
            `${import.meta.env.VITE_APP_API}/features/${isStagingEnv ? 'llm-staging' : 'llm'}`
        );
        const data: { features: FeatureFlags } = await response.json();
        const features = data.features as FeatureFlags;
        return applyFeatureOverridesFromUrl(features);
    } catch {
        return {
            allowReportProblem: false,
            allowAudit: false,
        };
    }
});
