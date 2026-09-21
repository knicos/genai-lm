import { ExactSearchResult } from './ExactSearch';
import { TokenSelectState } from '../../state/uiState';
import type { ChainedContext } from '../chaining';
import { ExtendedGeneratorConversation } from '../../state/generator';
import { matchContext } from '../chaining';

export interface ContextualisedResult extends ExactSearchResult {
    queryPrefix: number[];
    querySuffix: number[];
    matchPrefix: number[];
    matchSuffix: number[];
    prefixChain: ChainedContext;
    suffixChain: ChainedContext;
    contextScore: number;
}

function removeSpecialPrefix(tokens: number[], maxSpecial: number): number[] {
    for (let i = tokens.length - 1; i >= 0; --i) {
        if (tokens[i] <= maxSpecial) {
            return tokens.slice(i + 1);
        }
    }
    return tokens;
}

function removeSpecialSuffix(tokens: number[], maxSpecial: number): number[] {
    for (let i = 0; i < tokens.length; ++i) {
        if (tokens[i] <= maxSpecial) {
            return tokens.slice(0, i);
        }
    }
    return tokens;
}

export default function addContextToResults(
    conversation: ExtendedGeneratorConversation[],
    selection: TokenSelectState,
    results: ExactSearchResult[],
    size: number
): ContextualisedResult[] {
    const queryPrefix = results.map(
        (start) =>
            conversation[selection.conversationIndex]._output?.slice(
                Math.max(0, selection.startToken + start.queryPosition - size),
                selection.startToken + start.queryPosition
            ) ?? []
    );
    const queryPrefixTokens = queryPrefix.map((q) => q.map((o) => o.token));
    const querySuffix = results.map(
        (start) =>
            conversation[selection.conversationIndex]._output?.slice(
                selection.startToken + start.queryPosition + start.matchLength,
                selection.startToken + start.queryPosition + start.matchLength + size
            ) ?? []
    );
    const querySuffixTokens = querySuffix.map((q) => q.map((o) => o.token));

    const truncatedMatchPrefix = results.map((r) => removeSpecialPrefix(Array.from(r.matchPrefix ?? []), 10));
    const truncatedMatchSuffix = results.map((r) => removeSpecialSuffix(Array.from(r.matchSuffix ?? []), 10));

    const matchedContext = results.map((_, index) =>
        matchContext(
            queryPrefixTokens[index],
            truncatedMatchPrefix[index],
            querySuffixTokens[index],
            truncatedMatchSuffix[index]
        )
    );

    const contextualisedResults = results.map((result, index) => ({
        ...result,
        queryPrefix: queryPrefixTokens[index],
        querySuffix: querySuffixTokens[index],
        matchPrefix: truncatedMatchPrefix[index],
        matchSuffix: truncatedMatchSuffix[index],
        prefixChain: matchedContext[index].prefix,
        suffixChain: matchedContext[index].suffix,
        contextScore: matchedContext[index].totalScore,
    }));

    contextualisedResults.sort((a, b) => {
        if (b.matchLength !== a.matchLength) {
            return b.matchLength - a.matchLength;
        }
        return b.contextScore - a.contextScore;
    });

    return contextualisedResults;
}
