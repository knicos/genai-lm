import { useAtom, useAtomValue } from 'jotai';
import Box from '../../components/BoxTitle/Box';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import { datasetAtom, dataTokens, dataTokensReady } from '../../state/data';
import { modelAtom } from '../../state/model';
import style from './style.module.css';
import { useTranslation } from 'react-i18next';
import { Button, VerticalButton } from '@genai-fi/base';
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';
import { useState } from 'react';
import { tasks, tokensFromTasks } from '@genai-fi/nanogpt';
import DataProgress from '../../components/DataProgress/DataProgress';
import useModelLoaded from '../../utilities/useModelLoaded';
import ProgressBox from '../TextData/ProgressBox';
import useModelStatus from '../../utilities/useModelStatus';
import MarginIcon from '@mui/icons-material/Margin';
import BoxNotice, { Notice } from '../../components/BoxTitle/BoxNotice';

export default function TokeniseData() {
    const { t } = useTranslation();
    const model = useAtomValue(modelAtom);
    const status = useModelStatus(model ?? undefined);
    const ready = useModelLoaded(model ?? undefined);
    const dataset = useAtomValue(datasetAtom);
    const [tokens, setTokens] = useAtom(dataTokens);
    const [tokenising, setTokenising] = useState(false);
    const [_tokenCount, setTokenCount] = useState(0);
    const done = useAtomValue(dataTokensReady);
    const [message, setMessage] = useState<Notice | null>(null);

    const tokenCount = _tokenCount === 0 ? tokens?.length || 0 : _tokenCount;

    return (
        <Box
            widget="tokeniseData"
            active={dataset !== null && dataset.length > 0 && ready && status !== 'awaitingTokens'}
            style={{ minWidth: '290px' }}
        >
            <div className={style.container}>
                <BoxTitle
                    title={t('tokeniseData.title')}
                    status={done ? 'done' : 'waiting'}
                />
                <div className={style.progressBox}>
                    <DataProgress
                        samplesProcessed={tokenCount}
                        desiredSamples={ready ? (model?.getNumParams() || 0) * 2 : 0}
                    />
                    <ProgressBox
                        totalSamples={tokenCount}
                        label={t('tokeniseData.tokens')}
                    />
                </div>
                <div className={style.buttonBox}>
                    <Button
                        disabled={tokenising}
                        variant="contained"
                        startIcon={<ModelTrainingIcon />}
                        onClick={() => {
                            if (model && dataset && dataset.length > 0 && model.tokeniser.trained) {
                                setTokenising(true);
                                setTokenCount(0);
                                setTokens(null);

                                const task = new tasks.PretrainingTask(dataset);
                                return tokensFromTasks([task], model.tokeniser, (tokens: number) => {
                                    setTokenCount(tokens);
                                }).then((newTokens) => {
                                    setTokens(newTokens);
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
                    <VerticalButton
                        startIcon={<MarginIcon />}
                        onClick={() => {}}
                    >
                        {t('tokeniseData.show')}
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
    );
}
