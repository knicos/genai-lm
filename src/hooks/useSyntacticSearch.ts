import { useCallback, useRef, useState } from 'react';
import { TokenSelectState } from '../state/uiState';
import type { ExtendedGeneratorConversation } from '../state/generator';
import { TeachableLLM, tokenise } from '@genai-fi/nanogpt';
import { DataTokens, DataEntry } from '../state/data';
import Downloader from '../utilities/downloader';
import { autoTokeniseData } from '../workflow/TextTraining/utilities';
import prettyResults, { PrettyResult } from '../utilities/search/prettyResult';
import NGramSearch from '../utilities/search/ExactSearch';
import addContextToResults, { ContextualisedResult } from '../utilities/search/contextualise';

interface ResultStats {
    exactMatches: number;
    approximate: boolean;
    partialMatches: number;
}

const indexCache = new Map<string, NGramSearch>();

const NGRAM = 5;

function getOrCreateIndex(datasetId: string, tokens: tokenise.TokenStore, n: number) {
    const index = indexCache.get(datasetId);
    if (index) {
        return index;
    }
    const newIndex = new NGramSearch(tokens, n);
    indexCache.clear();
    indexCache.set(datasetId, newIndex);
    return newIndex;
}

export default function useSyntacticSearch(
    model: TeachableLLM | null,
    dataset: DataTokens | null,
    entries: DataEntry[],
    datasetId: string,
    onDataset: (dataset: DataTokens) => void
) {
    const [downloaders, setDownloaders] = useState<Downloader[]>([]);
    const [tokeniseProgress, setTokeniseProgress] = useState<number | null>(null);
    const busyRef = useRef(false);
    const [indexProgress, setIndexProgress] = useState<number | null>(null);
    //const indexRef = useRef<NGramSearch | null>(null);
    const [results, setResults] = useState<PrettyResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [resultStats, setResultStats] = useState<ResultStats | null>(null);
    const fullResultsRef = useRef<ContextualisedResult[] | null>(null);

    const doClear = useCallback(() => {
        setResults([]);
        fullResultsRef.current = null;
        setResultStats(null);
    }, []);

    const doSearch = useCallback(
        async (selection: TokenSelectState, conversation: ExtendedGeneratorConversation[]) => {
            if (busyRef.current) {
                return;
            }
            busyRef.current = true;

            setResults([]);
            setResultStats(null);

            let actualDataset = dataset;

            if (!dataset && entries && model && entries.length > 0) {
                const downloaders = entries
                    .map((entry) => (entry.downloader && !entry.hasLoaded ? entry.downloader : null))
                    .filter(Boolean) as Downloader[];
                setDownloaders(downloaders);
                const newData = await autoTokeniseData(entries, model, datasetId, {
                    onDownloadsDone: () => {
                        setDownloaders([]);
                        setTokeniseProgress(0);
                    },
                    cb: (progress) => {
                        setTokeniseProgress(progress);
                    },
                });
                setTokeniseProgress(null);
                actualDataset = newData.trainingTokens;
                onDataset(newData.trainingTokens);
            }

            if (actualDataset?.tokens && selection) {
                // Adjust selection to ensure it has at least an n-gram (5 tokens)
                const adjustedSelection = { ...selection };

                const selectionLength = adjustedSelection.endToken - adjustedSelection.startToken + 1;
                if (selectionLength < NGRAM) {
                    const expandBy = NGRAM - selectionLength;
                    adjustedSelection.startToken = Math.max(0, adjustedSelection.startToken - Math.floor(expandBy / 2));
                    adjustedSelection.endToken = adjustedSelection.endToken + Math.ceil(expandBy / 2);
                }

                const selectedText = conversation[adjustedSelection.conversationIndex]._output?.slice(
                    adjustedSelection.startToken,
                    adjustedSelection.endToken + 1
                );

                if (selectedText && model) {
                    try {
                        const ngramSearch = getOrCreateIndex(datasetId, actualDataset.tokens, NGRAM);

                        ngramSearch.on('indexProgress', (progress) => setIndexProgress(progress));
                        ngramSearch.on('status', (status) => {
                            if (status === 'indexing') {
                                setIndexProgress(0);
                            } else if (status === 'ready') {
                                setIndexProgress(null);
                            }
                        });

                        await ngramSearch.assertReady();

                        setSearching(true);

                        const query = selectedText.map((s) => s.token);
                        const resultInfo = await ngramSearch.search(query, { contextSize: 20 });

                        setResultStats({
                            exactMatches: resultInfo.estimatedMatches,
                            approximate: resultInfo.estimatedMatches > resultInfo.exactMatches,
                            partialMatches: resultInfo.results.length - resultInfo.exactMatches,
                        });

                        ngramSearch.removeAllListeners();

                        const contextResults = addContextToResults(
                            conversation,
                            adjustedSelection,
                            resultInfo.results,
                            20
                        );
                        fullResultsRef.current = contextResults;

                        const slicedResults = contextResults.slice(0, 5);
                        const results = prettyResults(slicedResults, query, model.tokeniser);

                        setSearching(false);
                        setResults(results);
                    } catch (error) {
                        console.error('Error during bloom search:', error);
                        setSearching(false);
                    }
                }
            }
            busyRef.current = false;
        },
        [dataset, model, datasetId, entries, onDataset]
    );

    const doMore = useCallback(
        (selection: TokenSelectState | null, conversation: ExtendedGeneratorConversation[]) => {
            if (model && selection && fullResultsRef.current) {
                const start = results.length;
                const moreResults = fullResultsRef.current?.slice(start, start + 5) || [];
                const selectedText = conversation[selection.conversationIndex]._output?.slice(
                    selection.startToken,
                    selection.endToken + 1
                );
                if (selectedText) {
                    const query = selectedText.map((s) => s.token);
                    const prettyMore = prettyResults(moreResults, query, model.tokeniser);
                    setResults((prevResults) => [...prevResults, ...prettyMore]);
                }
            }
        },
        [model, fullResultsRef, results]
    );

    return {
        search: doSearch,
        clear: doClear,
        more: doMore,
        searching,
        results,
        resultStats,
        indexProgress,
        tokeniseProgress,
        downloaders,
        isReady: indexProgress === null && tokeniseProgress === null && downloaders.length === 0,
        hasMore: fullResultsRef.current ? results.length < fullResultsRef.current.length : false,
    };
}
