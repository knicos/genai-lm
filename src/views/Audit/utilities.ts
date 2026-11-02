import type { GeneratorConversation } from '@genai-fi/nanogpt';
import { TokenSelectState } from '../../state/uiState';
import { ConversationHighlight } from '../../state/generator';

export function sliceConversation(conversation: GeneratorConversation[], index: number, tokenIndex: number) {
    const sliceConvo = conversation.slice(0, index + 1);
    if (sliceConvo.length > 0) {
        const lastMessage = sliceConvo[sliceConvo.length - 1];
        const slicedOutput = lastMessage._output?.slice(0, tokenIndex);
        sliceConvo[sliceConvo.length - 1] = {
            ...lastMessage,
            _output: slicedOutput,
            content: slicedOutput?.map((o) => o.text).join('') ?? '',
        };
    }
    return sliceConvo;
}

export function sliceSelectedText(conversation: GeneratorConversation[], selection: TokenSelectState, direction = 0) {
    const start =
        direction == 0
            ? selection.startToken
            : direction < 0
              ? Math.max(0, selection.startToken + direction)
              : selection.endToken + 1;
    const end =
        direction === 0
            ? selection.endToken + 1
            : direction < 0
              ? selection.startToken
              : selection.endToken + 1 + direction;

    const originalText =
        conversation[selection.conversationIndex]?._output
            ?.slice(start, end)
            .map((o) => o.text)
            .join('') ?? '';
    return originalText;
}

export function highlightsFromRescore(
    conversation: GeneratorConversation[],
    conversationIndex: number,
    template: Partial<ConversationHighlight>,
    threshold: number,
    skip?: Set<number>
): ConversationHighlight[] {
    const highlights: ConversationHighlight[] = [];
    const message = conversation[conversationIndex];

    const maxDelta =
        message?._output?.reduce((max, output, tokenIndex) => {
            if (skip?.has(tokenIndex)) return max;
            const change = Math.abs((output.rescore ?? output.score ?? 0) - (output.score ?? output.rescore ?? 0));
            return Math.max(max, change);
        }, 0) ?? 0;

    if (maxDelta < 0.01) return [];

    message?._output?.forEach((output, tokenIndex) => {
        const change = Math.abs((output.rescore ?? output.score ?? 0) - (output.score ?? output.rescore ?? 0));
        if (change >= maxDelta * threshold && !skip?.has(tokenIndex)) {
            highlights.push({
                index: conversationIndex,
                start: tokenIndex,
                end: tokenIndex,
                strike: false,
                colour: 'blue',
                erase: false,
                ...template,
            });
        }
    });
    return highlights;
}

export interface Changes {
    change: number;
    tokenIndex: number;
}

export function changesFromRescore(
    conversation: GeneratorConversation[],
    conversationIndex: number,
    threshold: number,
    skip?: Set<number>
): Changes[] {
    const changes: Changes[] = [];
    const message = conversation[conversationIndex];
    const maxDelta =
        message?._output?.reduce((max, output, tokenIndex) => {
            if (skip?.has(tokenIndex)) return max;
            const rescore = output.rescore ?? output.score ?? 0;
            //if (rescore === undefined) throw new Error(`Rescore is undefined for tokenIndex ${tokenIndex}`);
            const change = Math.abs(rescore - (output.score ?? output.rescore ?? 0));
            return Math.max(max, change);
        }, 0) ?? 0;

    if (maxDelta < 0.01) return [];

    message?._output?.forEach((output, tokenIndex) => {
        const change = (output.rescore ?? output.score ?? 0) - (output.score ?? output.rescore ?? 0);
        if (Math.abs(change) >= maxDelta * threshold && !skip?.has(tokenIndex)) {
            changes.push({
                change,
                tokenIndex,
            });
        }
    });

    changes.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

    return changes;
}
