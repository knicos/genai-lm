import { useAtom, useAtomValue } from 'jotai';
import Box from '../../components/BoxTitle/Box';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import { modelAtom, modelConfigAtom } from '../../state/model';
import style from './style.module.css';
import { useTranslation } from 'react-i18next';
import { Button } from '@genai-fi/base';
import ConstructionIcon from '@mui/icons-material/Construction';
import useModelLoaded from '../../hooks/useModelLoaded';
import { GPTConfig, TeachableLLM } from '@genai-fi/nanogpt';
import { Alert } from '@mui/material';
import Help from '../../components/Help/Help';

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

    const isUpToDate = !!model && ready && isConfigEqual(model.config, architecture);

    return (
        <Help
            message={t('checkmodel.help')}
            widget="checkmodel"
            active={ready}
        >
            <Box style={{ minWidth: '290px' }}>
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
                            disabled={isUpToDate}
                            variant="contained"
                            startIcon={<ConstructionIcon />}
                            fullWidth
                            onClick={() => {
                                setModel((old) => {
                                    if (old) {
                                        old.dispose();
                                    }
                                    const newModel = TeachableLLM.create(
                                        architecture.vocabSize <= 256 ? 'char' : 'bpe',
                                        architecture
                                    );
                                    if (old) {
                                        newModel.meta.name = old.meta.name;
                                    }
                                    return newModel;
                                });
                            }}
                        >
                            {t('checkmodel.start')}
                        </Button>
                    </div>
                </div>
            </Box>
        </Help>
    );
}
