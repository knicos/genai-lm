import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { dataTokens } from '../../state/data';
import type { ContextualisedResult } from '../../utilities/search/contextualise';
import { loadedModelAtom } from '../../state/model';
import { useEffect, useState, useRef, useCallback } from 'react';
import { TokenSelectState, uiSelectedTokens, uiTokenSelectLength } from '../../state/uiState';
import { rawGeneratedTextAtom } from '../../state/generator';
import NGramSearch from '../../utilities/search/ExactSearch';
import style from './SynSearch.module.css';
import { Button, PercentageBar, Spinner } from '@genai-fi/base';
import { HIGHLIGHT_COLOURS } from '../../components/ConversationDisplay/TokenRender';
import { Alert, LinearProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { PrettyResult } from '../../utilities/search/prettyResult';
import addContextToResults from '../../utilities/search/contextualise';
import prettyResults from '../../utilities/search/prettyResult';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Help } from '@genai-fi/base';

interface ResultStats {
    exactMatches: number;
    approximate: boolean;
    partialMatches: number;
}

export default function SynSearch() {
    const { t } = useTranslation();
    const dataset = useAtomValue(dataTokens);
    const [selection, setSelection] = useAtom(uiSelectedTokens);
    const setSelectionLength = useSetAtom(uiTokenSelectLength);
    const conversation = useAtomValue(rawGeneratedTextAtom);
    const model = useAtomValue(loadedModelAtom);
    const indexRef = useRef<NGramSearch | null>(null);
    const [results, setResults] = useState<PrettyResult[]>([]);
    const busyRef = useRef(false);
    const [indexProgress, setIndexProgress] = useState<number | null>(null);
    const [resultStats, setResultStats] = useState<ResultStats | null>(null);
    const [searching, setSearching] = useState(false);
    const fullResultsRef = useRef<ContextualisedResult[] | null>(null);

    useEffect(() => {
        setSelectionLength(128);
        setSelection(null);
        return () => {
            setSelectionLength(0);
            setSelection(null);
        };
    }, [setSelectionLength, setSelection]);

    useEffect(() => {
        indexRef.current = null;
    }, [dataset]);

    const doSearch = useCallback(
        async (selection: TokenSelectState) => {
            if (busyRef.current) {
                return;
            }
            busyRef.current = true;
            if (dataset?.tokens && selection) {
                const selectedText = conversation[selection.conversationIndex]._output?.slice(
                    selection.startToken,
                    selection.endToken + 1
                );

                if (selectedText && model) {
                    const startTime = performance.now();
                    try {
                        const ngramSearch = indexRef.current ? indexRef.current : new NGramSearch(dataset.tokens, 5);
                        indexRef.current = ngramSearch;

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

                        const contextResults = addContextToResults(conversation, selection, resultInfo.results, 20);
                        fullResultsRef.current = contextResults;

                        const slicedResults = contextResults.slice(0, 5);
                        const results = prettyResults(slicedResults, query, model.tokeniser);

                        setSearching(false);
                        setResults(results);
                    } catch (error) {
                        console.error('Error during bloom search:', error);
                        setSearching(false);
                    } finally {
                        const endTime = performance.now();
                        console.log(`Total search took ${endTime - startTime} ms`);
                    }
                }
            }
            busyRef.current = false;
        },
        [dataset, conversation, model]
    );

    useEffect(() => {
        if (selection) {
            doSearch(selection);
        } else {
            setResults([]);
            fullResultsRef.current = null;
            setResultStats(null);
        }
    }, [selection, doSearch]);

    return (
        <div className={style.container}>
            <Help
                inplace
                dark
                message={t('audit.syntactic.help')}
                keepOpen
                placement="left"
            >
                <h3>{t('audit.syntactic.title')}</h3>
            </Help>
            {indexProgress !== null && (
                <div className={style.indexProgress}>
                    <label>{t('audit.syntactic.indexing')}</label>
                    <LinearProgress
                        variant="determinate"
                        value={indexProgress * 100}
                        sx={{ '.MuiLinearProgress-bar': { transition: 'none' } }}
                    />
                </div>
            )}
            {resultStats?.exactMatches === 0 && (
                <div className={style.numResults}>
                    {t('audit.syntactic.partial', { count: resultStats?.partialMatches ?? 0 })}
                </div>
            )}
            {resultStats && resultStats?.exactMatches > 0 && (
                <div className={style.numResults}>
                    {t(resultStats.approximate ? 'audit.syntactic.approximate' : 'audit.syntactic.exact', {
                        count: resultStats?.exactMatches ?? 0,
                    })}
                </div>
            )}
            {selection && indexProgress === null && results.length === 0 && (
                <Alert severity="info">{t('audit.syntactic.noResults')}</Alert>
            )}
            {!selection && <Alert severity="info">{t('audit.syntactic.noSelection')}</Alert>}
            <ul className={style.resultList}>
                {results.map((result, i) => (
                    <li key={i}>
                        <div className={style.resultText}>
                            {result.prefixFragments.map((fragment, j) => (
                                <span
                                    key={j}
                                    className={fragment.match ? style.highlightedNoBorder : ''}
                                    style={
                                        fragment.match
                                            ? ({ '--highlight-color': HIGHLIGHT_COLOURS.green } as React.CSSProperties)
                                            : undefined
                                    }
                                >
                                    {fragment.text}
                                </span>
                            ))}
                            <span
                                className={style.highlighted}
                                style={{ '--highlight-color': HIGHLIGHT_COLOURS.purple } as React.CSSProperties}
                            >
                                {result.text}
                            </span>
                            {result.suffixFragments.map((fragment, j) => (
                                <span
                                    key={j}
                                    className={fragment.match ? style.highlightedNoBorder : ''}
                                    style={
                                        fragment.match
                                            ? ({ '--highlight-color': HIGHLIGHT_COLOURS.green } as React.CSSProperties)
                                            : undefined
                                    }
                                >
                                    {fragment.text}
                                </span>
                            ))}
                        </div>
                        <div className={style.infoRow}>
                            <div style={{ flexGrow: 1, width: '100%' }} />
                            <PercentageBar
                                style={{ fontSize: '0.8rem', height: '1.2rem', minWidth: '100px', width: 'unset' }}
                                colour="blue"
                                value={result.percentage * 100}
                            />
                        </div>
                    </li>
                ))}
            </ul>
            {results.length < (fullResultsRef.current?.length ?? 0) && (
                <div className={style.moreButtonContainer}>
                    <Button
                        variant="outlined"
                        startIcon={<ExpandMoreIcon />}
                        onClick={() => {
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
                        }}
                    >
                        {t('audit.syntactic.more')}
                    </Button>
                </div>
            )}
            {searching && (
                <div className={style.searchingIndicator}>
                    <Spinner />
                </div>
            )}
        </div>
    );
}
