import { GPTConfig } from '@genai-fi/nanogpt';
import { BAR_BUTTON_SIZE, BAR_BUTTON_SPACING, endVocabStart, vocabToWidth } from './sizeUtils';
import { theme } from '../../theme';

interface Props {
    config: GPTConfig;
    startY: number;
    height: number;
    gap: number;
}

export default function Flow({ config, startY, height, gap }: Props) {
    const vW = vocabToWidth(config.vocabSize) * 0.9;
    const lW = config.nEmbed * 2 * 0.9;
    const vX = -vW / 2;
    const vY1 = startY + height / 2;
    const lX = -lW / 2;
    const lY1 = startY + height / 2 + gap + BAR_BUTTON_SIZE + BAR_BUTTON_SPACING;
    const lY2 = endVocabStart(startY, config) - gap - BAR_BUTTON_SIZE - BAR_BUTTON_SPACING;
    const vY2 = lY2 + gap + BAR_BUTTON_SIZE + BAR_BUTTON_SPACING;

    return (
        <path
            opacity={0.2}
            fill={theme.light.success}
            d={`M${vX},${vY1} L${lX},${lY1} L${lX},${lY2} L${vX},${vY2} L${vX + vW},${vY2} L${lX + lW},${lY2} L${lX + lW},${lY1} L${vX + vW},${vY1} Z`}
        />
    );
}
