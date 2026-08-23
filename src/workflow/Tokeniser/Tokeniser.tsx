import { useAtomValue, useSetAtom } from 'jotai';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import { dataEntries, datasetIdAtom, dataTokens } from '../../state/data';
import { loadedModelAtom } from '../../state/model';
import style from './style.module.css';
import { useTranslation } from 'react-i18next';
import { Button, Help } from '@genai-fi/base';
import ConstructionIcon from '@mui/icons-material/Construction';
import { useEffect, useState } from 'react';
import useModelPhase from '../../hooks/useModelMode';
import { Alert } from '@mui/material';
import BoxNotice, { Notice } from '../../components/BoxTitle/BoxNotice';
import { createDatasetFromEntries } from '../../utilities/dataset';
import { trainingAnimation } from '../../state/animations';
import ProgressBox from '../TextData/ProgressBox';
import DataProgress from '../../components/DataProgress/DataProgress';
import Box from '../../components/BoxTitle/Box';

export default function Tokeniser() {
    const { t } = useTranslation();
    const model = useAtomValue(loadedModelAtom);
    //const status = useModelStatus(model ?? undefined);
    const dataset = useAtomValue(dataEntries);
    const datasetId = useAtomValue(datasetIdAtom);
    const [tokenising, setTokenising] = useState(false);
    const [done, setDone] = useState(model?.tokeniser.trained ?? false);
    const phase = useModelPhase(model ?? undefined);
    const setTokens = useSetAtom(dataTokens);
    const [message, setMessage] = useState<Notice | null>(null);
    const [count, setCount] = useState(0);
    const istraining = useAtomValue(trainingAnimation);

    const isTrained = model?.loaded && model.tokeniser.trained;

    const invalid = isTrained && datasetId !== model.tokeniser.datasetID;

    useEffect(() => {
        if (!model) {
            setDone(false);
            setCount(0);
        }
        const h = () => {
            setDone(model?.tokeniser.trained ?? false);
        };
        model?.on('status', h);
        if (model?.tokeniser.trained) {
            setCount(model?.tokeniser.vocabSize ?? 0);
        }
        setDone(model?.tokeniser.trained ?? false);
        return () => {
            model?.off('status', h);
        };
    }, [model]);

    return (
        <Help
            widget="tokeniser"
            message={t('tokeniser.help')}
            active={dataset !== null && dataset.length > 0}
            keepOpen
            placement="right"
        >
            <Box
                style={{ width: '250px', minHeight: '180px' }}
                active={dataset !== null && dataset.length > 0}
                widget="tokeniser"
                disabled={istraining}
                useParent
            >
                <div className={style.container}>
                    <BoxTitle
                        title={t('tokeniser.title')}
                        status={done ? 'done' : 'waiting'}
                    />
                    <div className={style.progressBox}>
                        <DataProgress
                            value={count}
                            max={model?.config?.vocabSize ?? 0}
                        />
                        <ProgressBox
                            totalSamples={count}
                            label={t('tokeniseData.tokens')}
                        />
                    </div>
                    {invalid && isTrained && !tokenising && (
                        <Alert
                            sx={{ margin: '1rem 1rem 0 1rem' }}
                            severity="warning"
                        >
                            {t(phase === 'untrained' ? 'tokeniser.invalidWarning' : 'tokeniser.trainedWarning')}
                        </Alert>
                    )}
                    <div className={style.buttonBox}>
                        <Button
                            disabled={tokenising}
                            variant="contained"
                            startIcon={<ConstructionIcon />}
                            onClick={async () => {
                                if (model && dataset && dataset.length > 0) {
                                    setCount(0);
                                    setDone(false);
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
                                            setDone(true);
                                            setTokens(null);
                                            setCount(model?.tokeniser.vocabSize ?? 0);
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
            </Box>
        </Help>
    );
}
