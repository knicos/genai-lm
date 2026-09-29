import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { uiFatalError } from '../../state/uiState';
import { modelAtom, modelConfigAtom, modelSizeLimit } from '../../state/model';
import style from './style.module.css';
import { useTranslation } from 'react-i18next';
import { Button } from '@genai-fi/base';
import ConstructionIcon from '@mui/icons-material/Construction';
import useModelLoaded from '../../hooks/useModelLoaded';
import { utilities, GPTConfig, TeachableLLM } from '@genai-fi/nanogpt';
import { Alert } from '@mui/material';
import { useState } from 'react';
import BoxNotice, { Notice } from '../../components/BoxTitle/BoxNotice';
import RestoreIcon from '@mui/icons-material/Restore';
import { deleteCheckpoint } from '../../utilities/db';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';

export function isConfigEqual(a: GPTConfig, b: GPTConfig) {
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

export default function BuildModel() {
    const { t } = useTranslation();
    const [model, setModel] = useAtom(modelAtom);
    //const status = useModelStatus(model ?? undefined);
    const ready = useModelLoaded(model ?? undefined);
    const architecture = useAtomValue(modelConfigAtom);
    const sizeLimit = useAtomValue(modelSizeLimit) * 1_000_000;
    const [message, setMessage] = useState<Notice | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const setFatalError = useSetAtom(uiFatalError);

    const isUpToDate = !!model && ready && isConfigEqual(model.config, architecture);
    const paramCount = utilities.estimateParameterCount(architecture);
    const exceedsSizeLimit = paramCount > sizeLimit;

    const resetModel = () => {
        setModel((old) => {
            if (old) {
                old.dispose();
            }
            const canReuseTokeniser = old && architecture.vocabSize === old.config.vocabSize;
            const newModel = TeachableLLM.create(
                canReuseTokeniser ? old.tokeniser : architecture.vocabSize <= 256 ? 'char' : 'bpe',
                architecture
            );
            if (old) {
                newModel.meta.name = old.meta.name;
            }

            newModel['ee'].on('lost', () => {
                window.sessionStorage.setItem('fatalError', 'true');
                setFatalError(true);
            });

            deleteCheckpoint();
            return newModel;
        });
    };

    return (
        <div className={style.buildContainer}>
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
                        if (model && ready && model.mode !== 'untrained') {
                            setShowConfirm(true);
                            return;
                        }
                        resetModel();
                    }}
                >
                    {t(isUpToDate ? 'checkmodel.refresh' : 'checkmodel.start')}
                </Button>
            </div>
            {!isUpToDate && <Alert severity="warning">{t('checkmodel.outdated')}</Alert>}
            {isUpToDate && <Alert severity="info">{t('checkmodel.upToDate')}</Alert>}
            {message && (
                <BoxNotice
                    notice={message}
                    onClose={() => setMessage(null)}
                />
            )}
            <ConfirmDialog
                open={showConfirm}
                title={t('checkmodel.confirm.title')}
                message={t('checkmodel.confirm.message')}
                confirmText={t(isUpToDate ? 'checkmodel.refresh' : 'checkmodel.start')}
                onConfirm={() => {
                    resetModel();
                    setShowConfirm(false);
                }}
                onCancel={() => setShowConfirm(false)}
            />
        </div>
    );
}
