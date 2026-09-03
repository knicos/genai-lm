import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export const uiShowSettings = atom(false);
export const uiShowVisualisation = atom(false);
export const uiShowSidePanel = atom(false);
export const uiDeveloperMode = atomWithStorage('uiDeveloperMode', false);
export const uiCompactMode = atomWithStorage('uiCompactMode', false);
export const uiFatalError = atom(false);

interface FeatureFlags {
    allowReportProblem?: boolean;
    allowAudit?: boolean;
}

export const featureFlagsAtom = atom(async () => {
    try {
        const isStagingEnv = !window.location.hostname.endsWith('gen-ai.fi');
        const response = await fetch(
            `${import.meta.env.VITE_APP_API}/features/${isStagingEnv ? 'llm-staging' : 'llm'}`
        );
        const data: { features: FeatureFlags } = await response.json();
        return data.features;
    } catch {
        return {
            allowReportProblem: false,
            allowAudit: false,
        };
    }
});
