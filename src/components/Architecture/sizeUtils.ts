import { GPTConfig } from '@genai-fi/nanogpt';

export const BAR_BUTTON_SIZE = 40;
export const BAR_BUTTON_SPACING = 20;
export const BLOCK_HEIGHT = 100;
export const BLOCK_GAP = 40;

export function vocabToWidth(vocab: number) {
    return Math.floor(vocab / 2);
}

export function widthToVocab(nextWidth: number) {
    return Math.round(nextWidth * 2);
}

export function endVocabStart(startY: number, config: GPTConfig) {
    return (
        startY +
        ((config.nLayer || 0) + 1) * (BLOCK_HEIGHT + BLOCK_GAP) +
        (2 * BAR_BUTTON_SIZE + 2 * BAR_BUTTON_SPACING) -
        BLOCK_HEIGHT / 2
    );
}

export function totalHeight(config: GPTConfig) {
    return (
        ((config.nLayer || 0) + 1) * (BLOCK_HEIGHT + BLOCK_GAP) + (2 * BAR_BUTTON_SIZE + 2 * BAR_BUTTON_SPACING) + 100
    );
}
