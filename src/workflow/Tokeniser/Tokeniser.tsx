import { useAtomValue, useSetAtom } from 'jotai';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import { dataEntries, datasetIdAtom, dataTokens } from '../../state/data';
import { loadedModelAtom } from '../../state/model';
import style from './style.module.css';
import { useTranslation } from 'react-i18next';
import { Button } from '@genai-fi/base';
import ConstructionIcon from '@mui/icons-material/Construction';
import { useEffect, useState } from 'react';
import useModelPhase from '../../hooks/useModelMode';
import { Alert } from '@mui/material';
import BoxNotice, { Notice } from '../../components/BoxTitle/BoxNotice';
import HelpBox from '../../components/Help/HelpBox';
import BoxStandalone from '../../components/BoxTitle/BoxStandalone';
import { createDatasetFromEntries } from '../../utilities/dataset';

export default function Tokeniser() {
    const { t } = useTranslation();
    const model = useAtomValue(loadedModelAtom);
    //const status = useModelStatus(model ?? undefined);
    const dataset = useAtomValue(dataEntries);
    const datasetId = useAtomValue(datasetIdAtom);
    const [tokenising, setTokenising] = useState(false);
    const [done, setDone] = useState(model?.loaded && model.tokeniser.trained);
    const phase = useModelPhase(model ?? undefined);
    const setTokens = useSetAtom(dataTokens);
    const [message, setMessage] = useState<Notice | null>(null);
    const [count, setCount] = useState(0);

    const isTrained = model?.loaded && model.tokeniser.trained;

    const invalid = isTrained && datasetId !== model.tokeniser.datasetID;

    useEffect(() => {
        const h = () => {
            setDone(model?.loaded && model.tokeniser.trained);
        };
        model?.on('status', h);
        return () => {
            model?.off('status', h);
        };
    }, [model]);

    return (
        <HelpBox
            widget="tokeniser"
            message={t('tokeniser.help')}
            active={dataset !== null && dataset.length > 0}
        >
            <BoxStandalone
                style={{ width: '250px', minHeight: '200px' }}
                active={dataset !== null && dataset.length > 0}
            >
                <div className={style.container}>
                    <BoxTitle
                        title={t('tokeniser.title')}
                        status={done ? 'done' : 'waiting'}
                    />
                    {invalid && isTrained && !tokenising && (
                        <Alert
                            sx={{ margin: '1rem 1rem 0 1rem' }}
                            severity="warning"
                        >
                            {t(phase === 'untrained' ? 'tokeniser.invalidWarning' : 'tokeniser.trainedWarning')}
                        </Alert>
                    )}
                    {!isTrained && !tokenising && (
                        <Alert
                            sx={{ margin: '1rem 1rem 0 1rem' }}
                            severity="info"
                        >
                            {t('tokeniser.notTrained')}
                        </Alert>
                    )}
                    {tokenising && <div className={style.progress}>{t('tokeniser.tokenising', { size: count })}</div>}
                    {!invalid && isTrained && !tokenising && (
                        <Alert
                            sx={{ margin: '1rem 1rem 0 1rem' }}
                            severity="success"
                        >
                            {t('tokeniser.trained', { size: model?.tokeniser.vocabSize || 0 })}
                        </Alert>
                    )}
                    <div className={style.buttonBox}>
                        <Button
                            disabled={tokenising}
                            variant="contained"
                            startIcon={<ConstructionIcon />}
                            onClick={async () => {
                                if (model && dataset && dataset.length > 0) {
                                    setTokenising(true);
                                    const data = await createDatasetFromEntries(dataset);
                                    model?.tokeniser
                                        .train(
                                            data,
                                            (progress) => {
                                                setCount(progress);
                                            },
                                            datasetId
                                        )
                                        .then(() => {
                                            setTokenising(false);
                                            setTokens(null);
                                        })
                                        .catch((e) => {
                                            console.error(e);
                                            setTokenising(false);
                                            setMessage({
                                                notice: t('tokeniser.trainError'),
                                                level: 'error',
                                            });
                                        });
                                } else if (!model) {
                                    setMessage({
                                        notice: t('tokeniser.noModel'),
                                        level: 'error',
                                    });
                                } else if (!dataset || dataset.length === 0) {
                                    setMessage({
                                        notice: t('tokeniser.noData'),
                                        level: 'error',
                                    });
                                }
                            }}
                        >
                            {t('tokeniser.start')}
                        </Button>
                    </div>
                    {message && (
                        <BoxNotice
                            notice={message}
                            onClose={() => setMessage(null)}
                        />
                    )}
                </div>
            </BoxStandalone>
        </HelpBox>
    );
}
