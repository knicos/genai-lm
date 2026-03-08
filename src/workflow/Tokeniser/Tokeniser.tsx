import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import Box from '../../components/BoxTitle/Box';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import { datasetAtom, dataTokens, tokeniserInvalid } from '../../state/data';
import { modelAtom } from '../../state/model';
import style from './style.module.css';
import { useTranslation } from 'react-i18next';
import { Button, VerticalButton } from '@genai-fi/base';
import ConstructionIcon from '@mui/icons-material/Construction';
import { useEffect, useState } from 'react';
import AbcIcon from '@mui/icons-material/Abc';
import useModelPhase from '../../utilities/useModelPhase';
import { Alert } from '@mui/material';
import BoxNotice, { Notice } from '../../components/BoxTitle/BoxNotice';
import { useNavigate } from 'react-router-dom';
import Help from '../../components/Help/Help';

export default function Tokeniser() {
    const { t } = useTranslation();
    const model = useAtomValue(modelAtom);
    //const status = useModelStatus(model ?? undefined);
    const dataset = useAtomValue(datasetAtom);
    const [tokenising, setTokenising] = useState(false);
    const [done, setDone] = useState(model?.loaded && model.tokeniser.trained);
    const phase = useModelPhase(model ?? undefined);
    const [invalid, setInvalid] = useAtom(tokeniserInvalid);
    const setTokens = useSetAtom(dataTokens);
    const [message, setMessage] = useState<Notice | null>(null);
    const navigate = useNavigate();

    const isTrained = model?.loaded && model.tokeniser.trained;

    useEffect(() => {
        if (dataset && dataset.length > 0) {
            setInvalid(true);
        }
    }, [dataset, setInvalid]);

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
        <Help
            widget="tokeniser"
            message={t('tokeniser.help')}
            active={dataset !== null && dataset.length > 0}
        >
            <Box style={{ maxWidth: '300px' }}>
                <div className={style.container}>
                    <BoxTitle
                        title={t('tokeniser.title')}
                        status={done ? 'done' : 'waiting'}
                    />
                    {invalid && isTrained && (
                        <Alert
                            sx={{ margin: '1rem 1rem 0 1rem' }}
                            severity="warning"
                        >
                            {t(phase === 'untrained' ? 'tokeniser.invalidWarning' : 'tokeniser.trainedWarning')}
                        </Alert>
                    )}
                    {!isTrained && (
                        <Alert
                            sx={{ margin: '1rem 1rem 0 1rem' }}
                            severity="info"
                        >
                            {t('tokeniser.notTrained')}
                        </Alert>
                    )}
                    {!invalid && isTrained && (
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
                            onClick={() => {
                                if (model && dataset && dataset.length > 0) {
                                    setTokenising(true);
                                    model?.tokeniser.train(dataset).then(() => {
                                        setTokenising(false);
                                        setInvalid(false);
                                        setTokens(null);
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
                            {tokenising ? t('tokeniser.stop') : t('tokeniser.start')}
                        </Button>
                        <VerticalButton
                            startIcon={<AbcIcon />}
                            onClick={() => navigate('vocabulary')}
                        >
                            {t('tokeniser.vocabulary')}
                        </VerticalButton>
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
