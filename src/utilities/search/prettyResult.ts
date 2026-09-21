import { ITokeniser } from '@genai-fi/nanogpt';
import type { ContextualisedResult } from './contextualise';
import { ChainedContext } from '../chaining';

interface HighlightFragment {
    start: number;
    end: number;
    text: string;
    match: boolean;
}

export interface PrettyResult {
    text: string;
    queryPrefix: string;
    querySuffix: string;
    matchPrefix: string;
    matchSuffix: string;
    matchLength: number;
    percentage: number;
    contextScore: number;
    position: number;
    prefixFragments: HighlightFragment[];
    suffixFragments: HighlightFragment[];
}

function buildHighlightFragments(chain: ChainedContext, tokens: number[], tokeniser: ITokeniser): HighlightFragment[] {
    if (tokens.length === 0) {
        return [];
    }

    const anchors = [...chain.chain].sort((a, b) => a.dataIndex - b.dataIndex || a.queryIndex - b.queryIndex);
    const fragments: HighlightFragment[] = [];

    const pushFragment = (start: number, end: number, match: boolean) => {
        if (start >= end) {
            return;
        }

        const text = tokens
            .slice(start, end)
            .map((token) => tokeniser.decode([token]))
            .join('');

        fragments.push({
            start,
            end,
            match: match && text.length > 3,
            text,
        });
    };

    if (anchors.length === 0) {
        pushFragment(0, tokens.length, false);
        return fragments;
    }

    let cursor = 0;
    let runStart = anchors[0].dataIndex;
    let runEnd = anchors[0].dataIndex;

    for (let i = 1; i < anchors.length; i++) {
        const prev = anchors[i - 1];
        const curr = anchors[i];
        const isContiguousMatch = curr.dataIndex === prev.dataIndex + 1 && curr.queryIndex === prev.queryIndex + 1;

        if (isContiguousMatch) {
            runEnd = curr.dataIndex;
            continue;
        }

        pushFragment(cursor, runStart, false);
        pushFragment(runStart, runEnd + 1, true);
        cursor = runEnd + 1;

        runStart = curr.dataIndex;
        runEnd = curr.dataIndex;
    }

    pushFragment(cursor, runStart, false);
    pushFragment(runStart, runEnd + 1, true);
    pushFragment(runEnd + 1, tokens.length, false);

    return fragments;
}

export default function prettyResults(
    results: ContextualisedResult[],
    query: number[],
    tokeniser: ITokeniser
): PrettyResult[] {
    const prettyResults = results.map((result) => {
        const prefixFragments = buildHighlightFragments(result.prefixChain, Array.from(result.matchPrefix), tokeniser);
        const suffixFragments = buildHighlightFragments(result.suffixChain, Array.from(result.matchSuffix), tokeniser);

        const prettyResult: PrettyResult = {
            text: query
                .slice(result.queryPosition, result.queryPosition + result.matchLength)
                .map((token) => tokeniser.decode([token]))
                .join(''),
            queryPrefix: result.queryPrefix.map((token) => tokeniser.decode([token])).join(''),
            querySuffix: result.querySuffix.map((token) => tokeniser.decode([token])).join(''),
            matchPrefix: Array.from(result.matchPrefix)
                .map((token) => tokeniser.decode([token]))
                .join(''),
            matchSuffix: Array.from(result.matchSuffix)
                .map((token) => tokeniser.decode([token]))
                .join(''),
            matchLength: result.matchLength,
            percentage: result.matchLength / query.length,
            contextScore: result.contextScore,
            position: result.position,
            prefixFragments,
            suffixFragments,
        };
        return prettyResult;
    });

    return prettyResults;
}
