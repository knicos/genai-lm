import style from './style.module.css';
import { useTranslation } from 'react-i18next';
import CircularProgress from '../../components/CircularProgress/CircularProgress';
import { useEffect, useState } from 'react';
import ModelIcon from '../../icons/ModelIcon';
import { Help } from '@genai-fi/base';

interface Props {
    layers: number;
    step: number;
    done?: boolean;
    spinning?: boolean;
    inferenceMode?: boolean;
}

export default function ModelBox({ layers, step, done, spinning, inferenceMode }: Props) {
    const { t } = useTranslation();
    const [spinStep, setSpinStep] = useState(0);

    useEffect(() => {
        if (!spinning) {
            return;
        }
        const interval = setInterval(() => {
            setSpinStep((s) => (s + 1) % layers);
        }, 200);
        return () => clearInterval(interval);
    }, [spinning, layers]);

    const numLayers = layers;

    let statusText = 'tools.modelIdle';
    if (inferenceMode) {
        if (step < 0) {
            statusText = 'tools.modelTokenising';
        } else if (step < numLayers) {
            statusText = 'tools.modelPredicting';
        } else if (spinning) {
            statusText = 'tools.modelDeciding';
        } else if (done) {
            statusText = 'tools.modelSelected';
        }
    } else {
        if (step < 0) {
            statusText = 'tools.modelSelecting';
        } else if (step < numLayers) {
            statusText = 'tools.modelPredicting';
        } else if (spinning) {
            statusText = 'tools.modelUpdating';
        } else if (done) {
            statusText = 'tools.modelComplete';
        }
    }

    return (
        <div className={style.modelBlock}>
            <CircularProgress
                totalSteps={numLayers}
                step={spinning ? spinStep : step}
                radius={40}
                done={done}
                spin={spinning}
            >
                <ModelIcon noExtraIcon />
            </CircularProgress>
            <Help
                message={t('training.modelBoxHelp')}
                inplace
                dark
            >
                <div className={style.modelLabel}>
                    <h3>
                        {t('tools.model')} ({t('tools.nlayers', { N: numLayers })})
                    </h3>

                    <div>{t(statusText)}</div>
                </div>
            </Help>
        </div>
    );
}
