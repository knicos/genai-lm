import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import {
    datasetIdAtom,
    dataTokens,
    dataTokensReady,
    dataEntries,
    validationTokens,
    tokeniseSettingsAtom,
} from '../../state/data';
import { loadedModelAtom } from '../../state/model';
import style from './style.module.css';
import { useTranslation } from 'react-i18next';
import { Button, Help } from '@genai-fi/base';
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';
import { useState } from 'react';
import DataProgress from '../../components/DataProgress/DataProgress';
import useModelLoaded from '../../hooks/useModelLoaded';
import ProgressBox from '../TextData/ProgressBox';
import useModelStatus from '../../hooks/useModelStatus';
import BoxNotice, { Notice } from '../../components/BoxTitle/BoxNotice';
import { createDatasetFromEntries } from '../../utilities/dataset';
import { Alert } from '@mui/material';
import { trainingAnimation } from '../../state/animations';
import { tokenise } from '@genai-fi/nanogpt';
import { useNavigate } from 'react-router';
import Box from '../../components/BoxTitle/Box';

const { tokensFromStreams } = tokenise;

const CHINCHILLA_OPTIMISATION_RATIO = 20.0;

export default function TokeniseData() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const model = useAtomValue(loadedModelAtom);
    const status = useModelStatus(model ?? undefined);
    const ready = useModelLoaded(model ?? undefined);
    const dataset = useAtomValue(dataEntries);
    const datasetId = useAtomValue(datasetIdAtom);
    const [tokens, setTokens] = useAtom(dataTokens);
    const setValidationTokens = useSetAtom(validationTokens);
    const [tokenising, setTokenising] = useState(false);
    const [_tokenCount, setTokenCount] = useState(0);
    const done = useAtomValue(dataTokensReady);
    const [message, setMessage] = useState<Notice | null>(null);
    const istraining = useAtomValue(trainingAnimation);
    const settings = useAtomValue(tokeniseSettingsAtom);

    const tokenCount = _tokenCount === 0 ? tokens?.tokens.getTokenCount() || 0 : _tokenCount;
    const desiredTokens = ready ? (model?.getNumParams() || 0) * CHINCHILLA_OPTIMISATION_RATIO : 0;
    const hasTooManyTokens = tokenCount > desiredTokens * 1.1;
    const hasEnoughTokens = tokenCount >= desiredTokens * 0.9 && !hasTooManyTokens;

    return (
        <Help
            widget="tokeniseData"
            placement="right"
            active={dataset !== null && dataset.length > 0 && ready && status !== 'awaitingTokens'}
            message={t('tokeniseData.help')}
            keepOpen
        >
            <Box
                style={{ width: '290px', minHeight: '200px' }}
                active={dataset !== null && dataset.length > 0 && ready && status !== 'awaitingTokens'}
                disabled={istraining}
                useParent
                widget="tokeniseData"
            >
                <div className={style.container}>
                    <BoxTitle
                        title={t('tokeniseData.title')}
                        status={done ? 'done' : 'waiting'}
                        onSettings={() => navigate('tokenise-settings')}
                    />
                    <div className={style.progressBox}>
                        <DataProgress
                            value={tokenCount}
                            desired={desiredTokens}
                        />
                        <ProgressBox
                            totalSamples={tokenCount}
                            label={t('tokeniseData.tokens')}
                        />
                    </div>
                    <Alert
                        severity={tokenising ? 'info' : hasEnoughTokens ? 'success' : 'warning'}
                        sx={{ marginTop: '1rem' }}
                    >
                        {tokenising
                            ? t('tokeniseData.busy')
                            : hasEnoughTokens
                              ? t('tokeniseData.enoughTokens')
                              : hasTooManyTokens
                                ? t('tokeniseData.tooManyTokens')
                                : t('tokeniseData.notEnoughTokens')}
                    </Alert>
                    <div className={style.buttonBox}>
                        <Button
                            disabled={tokenising}
                            variant="contained"
                            startIcon={<ModelTrainingIcon />}
                            onClick={async () => {
                                if (model && dataset && dataset.length > 0 && model.tokeniser.trained) {
                                    setTokenising(true);
                                    setTokenCount(0);
                                    setTokens(null);

                                    const task = await createDatasetFromEntries(dataset);
                                    return tokensFromStreams(task, model.tokeniser, datasetId, {
                                        cb: (tokens: number) => {
                                            setTokenCount(tokens);
                                        },
                                        validationSplit: settings.validationSplit,
                                        noOPFS: !settings.saveToOPFS,
                                        validationSeed: 44,
                                    }).then((newTokens) => {
                                        setTokens({
                                            tokens: newTokens.trainingTokens,
                                            tokeniserId: model.tokeniser.id,
                                            datasetId,
                                        });
                                        if (newTokens.validationTokens) {
                                            setValidationTokens({
                                                tokens: newTokens.validationTokens,
                                                tokeniserId: model.tokeniser.id,
                                                datasetId,
                                            });
                                        }
                                        setTokenCount(0);
                                        setTokenising(false);
                                    });
                                } else if (!model) {
                                    setMessage({
                                        notice: t('tokeniseData.noModel'),
                                        level: 'error',
                                    });
                                } else if (model && (!model.tokeniser.trained || model.tokeniser.vocabSize === 0)) {
                                    setMessage({
                                        notice: t('tokeniseData.notTrained'),
                                        level: 'error',
                                    });
                                } else if (!dataset || dataset.length === 0) {
                                    setMessage({
                                        notice: t('tokeniseData.noData'),
                                        level: 'error',
                                    });
                                }
                            }}
                        >
                            {t('tokeniseData.start')}
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
