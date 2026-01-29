import { useAtomValue, useSetAtom } from 'jotai';
import Box from '../../components/BoxTitle/Box';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import { datasetAtom, dataTokens, dataTokensReady } from '../../state/data';
import { modelAtom } from '../../state/model';
import style from './style.module.css';
import { useTranslation } from 'react-i18next';
import { Button } from '@genai-fi/base';
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';
import { useState } from 'react';
import { tasks, tokensFromTasks } from '@genai-fi/nanogpt';
import TokeniserMenu from './TokeniserMenu';
import DataProgress from '../../components/DataProgress/DataProgress';
import useModelLoaded from '../../utilities/useModelLoaded';

export default function Tokeniser() {
    const { t } = useTranslation();
    const model = useAtomValue(modelAtom);
    //const status = useModelStatus(model ?? undefined);
    const ready = useModelLoaded(model ?? undefined);
    const dataset = useAtomValue(datasetAtom);
    const [tokenising, setTokenising] = useState(false);
    const [tokenCount, setTokenCount] = useState(0);
    const setTokens = useSetAtom(dataTokens);
    const done = useAtomValue(dataTokensReady);

    return (
        <Box
            widget="tokeniser"
            active={dataset !== null && dataset.length > 0}
            style={{ minWidth: '290px' }}
        >
            <div className={style.container}>
                <BoxTitle
                    title={t('tokeniser.title')}
                    status={done ? 'done' : 'waiting'}
                />
                <TokeniserMenu
                    tokens={tokenCount}
                    training={tokenising}
                    onShowSettings={() => {}}
                    onVocab={() => {}}
                />
                <DataProgress
                    samplesProcessed={tokenCount}
                    desiredSamples={ready ? (model?.getNumParams() || 0) * 2 : 0}
                />
                <div className={style.buttonBox}>
                    <Button
                        disabled={!model || !dataset || dataset.length === 0 || tokenising}
                        variant="contained"
                        startIcon={<ModelTrainingIcon />}
                        onClick={() => {
                            if (model && dataset && dataset.length > 0) {
                                setTokenising(true);
                                setTokenCount(0);
                                model?.tokeniser
                                    .train(dataset)
                                    .then(() => {
                                        const task = new tasks.PretrainingTask(dataset);
                                        return tokensFromTasks([task], model.tokeniser, (tokens: number) => {
                                            setTokenCount(tokens);
                                        });
                                    })
                                    .then((newTokens) => {
                                        setTokens(newTokens);
                                        setTokenising(false);
                                    });
                            }
                        }}
                    >
                        {tokenising ? t('tokeniser.stop') : t('tokeniser.start')}
                    </Button>
                </div>
            </div>
        </Box>
    );
}
