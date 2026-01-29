import { useAtomValue } from 'jotai';
import Box from '../../components/BoxTitle/Box';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import { modelAtom } from '../../state/model';
import style from './style.module.css';
import { useTranslation } from 'react-i18next';
import { Button } from '@genai-fi/base';
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';
import { useState } from 'react';
import useModelLoaded from '../../utilities/useModelLoaded';

export default function CheckModel() {
    const { t } = useTranslation();
    const model = useAtomValue(modelAtom);
    //const status = useModelStatus(model ?? undefined);
    const ready = useModelLoaded(model ?? undefined);
    const [analysing, setAnalysing] = useState(false);

    return (
        <Box
            widget="checkmodel"
            active={ready}
            style={{ minWidth: '290px' }}
        >
            <div className={style.container}>
                <BoxTitle
                    title={t('checkmodel.title')}
                    status={ready ? 'done' : 'waiting'}
                />
                <div className={style.buttonBox}>
                    <Button
                        disabled={!model || analysing}
                        variant="contained"
                        startIcon={<ModelTrainingIcon />}
                        onClick={() => {
                            if (model) {
                                setAnalysing(true);
                            }
                        }}
                    >
                        {analysing ? t('checkmodel.stop') : t('checkmodel.start')}
                    </Button>
                </div>
            </div>
        </Box>
    );
}
