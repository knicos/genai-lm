import { useAtom, useAtomValue } from 'jotai';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import { modelAtom, modelConfigAtom, modelSizeLimit } from '../../state/model';
import style from './style.module.css';
import { useTranslation } from 'react-i18next';
import { Button } from '@genai-fi/base';
import ConstructionIcon from '@mui/icons-material/Construction';
import useModelLoaded from '../../hooks/useModelLoaded';
import { estimateParameterCount, GPTConfig, TeachableLLM } from '@genai-fi/nanogpt';
import { Alert } from '@mui/material';
import { useState } from 'react';
import BoxNotice, { Notice } from '../../components/BoxTitle/BoxNotice';
import HelpBox from '../../components/Help/HelpBox';
import BoxStandalone from '../../components/BoxTitle/BoxStandalone';
import RestoreIcon from '@mui/icons-material/Restore';

function isConfigEqual(a: GPTConfig, b: GPTConfig) {
    return (
        a.vocabSize === b.vocabSize &&
        a.nEmbed === b.nEmbed &&
        a.nHead === b.nHead &&
        a.nLayer === b.nLayer &&
        a.mlpFactor === b.mlpFactor &&
        a.modelType === b.modelType &&
        a.blockSize === b.blockSize
    );
}

export default function CheckModel() {
    const { t } = useTranslation();
    const [model, setModel] = useAtom(modelAtom);
    //const status = useModelStatus(model ?? undefined);
    const ready = useModelLoaded(model ?? undefined);
    const architecture = useAtomValue(modelConfigAtom);
    const sizeLimit = useAtomValue(modelSizeLimit) * 1_000_000;
    const [message, setMessage] = useState<Notice | null>(null);

    const isUpToDate = !!model && ready && isConfigEqual(model.config, architecture);
    const paramCount = estimateParameterCount(architecture);
    const exceedsSizeLimit = paramCount > sizeLimit;

    return (
        <HelpBox
            message={t('checkmodel.help')}
            widget="checkmodel"
            active={ready}
        >
            <BoxStandalone
                style={{ minWidth: '290px', minHeight: '100px' }}
                active={ready}
            >
                <div className={style.container}>
                    <BoxTitle
                        title={t('checkmodel.title')}
                        status={ready ? 'done' : 'waiting'}
                    />
                    {!isUpToDate && (
                        <Alert
                            sx={{ marginTop: '1rem' }}
                            severity="warning"
                        >
                            {t('checkmodel.outdated')}
                        </Alert>
                    )}
                    {isUpToDate && (
                        <Alert
                            sx={{ marginTop: '1rem' }}
                            severity="info"
                        >
                            {t('checkmodel.upToDate')}
                        </Alert>
                    )}
                    <div className={style.buttonBox}>
                        <Button
                            variant="contained"
                            startIcon={isUpToDate ? <RestoreIcon /> : <ConstructionIcon />}
                            fullWidth
                            onClick={() => {
                                if (exceedsSizeLimit) {
                                    setMessage({
                                        level: 'error',
                                        notice: t('checkmodel.exceedsSizeLimit'),
                                    });
                                    return;
                                }
                                setModel((old) => {
                                    if (old) {
                                        old.dispose();
                                    }
                                    const canReuseTokeniser = old && architecture.vocabSize === old.config.vocabSize;
                                    const newModel = TeachableLLM.create(
                                        canReuseTokeniser
                                            ? old.tokeniser
                                            : architecture.vocabSize <= 256
                                              ? 'char'
                                              : 'bpe',
                                        architecture
                                    );
                                    if (old) {
                                        newModel.meta.name = old.meta.name;
                                    }
                                    return newModel;
                                });
                            }}
                        >
                            {t(isUpToDate ? 'checkmodel.refresh' : 'checkmodel.start')}
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
