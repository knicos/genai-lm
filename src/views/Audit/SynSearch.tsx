import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { dataTokens, dataEntries, datasetIdAtom } from '../../state/data';
import { loadedModelAtom } from '../../state/model';
import { useEffect } from 'react';
import { uiSelectedTokens, uiTokenSelectLength } from '../../state/uiState';
import { rawGeneratedTextAtom } from '../../state/generator';
import style from './SynSearch.module.css';
import { Button, Spinner } from '@genai-fi/base';
import { Alert, LinearProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Help } from '@genai-fi/base';
import DownloadProgress from '../../components/DownloadProgress/DownloadProgress';
import prettyNumber from '../../utilities/prettyNumber';
import useSyntacticSearch from '../../hooks/useSyntacticSearch';
import TextSearchResult from '../../components/TextSearchResult/TextSearchResult';

export default function SynSearch() {
    const { t } = useTranslation();
    const [dataset, setDataset] = useAtom(dataTokens);
    const entries = useAtomValue(dataEntries);
    const [selection, setSelection] = useAtom(uiSelectedTokens);
    const setSelectionLength = useSetAtom(uiTokenSelectLength);
    const conversation = useAtomValue(rawGeneratedTextAtom);
    const model = useAtomValue(loadedModelAtom);
    const datasetId = useAtomValue(datasetIdAtom);

    const {
        search: doSearch,
        clear,
        more,
        hasMore,
        searching,
        results,
        resultStats,
        indexProgress,
        tokeniseProgress,
        downloaders,
        isReady,
    } = useSyntacticSearch(model, dataset, entries, datasetId, setDataset);

    useEffect(() => {
        setSelectionLength(128);
        setSelection(null);
        return () => {
            setSelectionLength(0);
            setSelection(null);
        };
    }, [setSelectionLength, setSelection]);

    useEffect(() => {
        if (selection) {
            doSearch(selection, conversation);
        } else {
            clear();
        }
    }, [selection, doSearch, conversation, clear]);

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
            {downloaders.length > 0 && (
                <div className={style.indexProgress}>
                    <DownloadProgress
                        downloads={downloaders}
                        style={{ width: '100%' }}
                    />
                </div>
            )}
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
            {tokeniseProgress !== null && (
                <div className={style.indexProgress}>
                    <label>{t('audit.syntactic.tokenising', { count: prettyNumber(tokeniseProgress, t) })}</label>
                    <LinearProgress variant="indeterminate" />
                </div>
            )}
            {isReady && resultStats?.exactMatches === 0 && (
                <div className={style.numResults}>
                    {t('audit.syntactic.partial', { count: resultStats?.partialMatches ?? 0 })}
                </div>
            )}
            {isReady && resultStats && resultStats?.exactMatches > 0 && (
                <div className={style.numResults}>
                    {t(resultStats.approximate ? 'audit.syntactic.approximate' : 'audit.syntactic.exact', {
                        count: resultStats?.exactMatches ?? 0,
                    })}
                </div>
            )}
            {isReady && selection && results.length === 0 && (
                <Alert severity="info">{t('audit.syntactic.noResults')}</Alert>
            )}
            {!selection && entries.length > 0 && <Alert severity="info">{t('audit.syntactic.noSelection')}</Alert>}
            {entries.length === 0 && <Alert severity="warning">{t('audit.syntactic.noData')}</Alert>}
            <ul className={style.resultList}>
                {results.map((result, i) => (
                    <TextSearchResult
                        result={result}
                        key={i}
                    />
                ))}
            </ul>
            {hasMore && (
                <div className={style.moreButtonContainer}>
                    <Button
                        variant="outlined"
                        startIcon={<ExpandMoreIcon />}
                        onClick={() => {
                            more(selection, conversation);
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
