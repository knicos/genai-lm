import style from './style.module.css';
import { useTranslation } from 'react-i18next';
import CircularProgress from '../../components/CircularProgress/CircularProgress';
import { useEffect, useState } from 'react';

interface Props {
    layers: number;
    step: number;
    done?: boolean;
    spinning?: boolean;
}

export default function ModelBox({ layers, step, done, spinning }: Props) {
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

    return (
        <div className={style.modelBlock}>
            <CircularProgress
                totalSteps={numLayers}
                step={spinning ? spinStep : step}
                radius={40}
                done={done}
                spin={spinning}
            >
                {step}/{numLayers}
            </CircularProgress>
            <div className={style.modelLabel}>
                <h3>
                    {t('tools.model')} ({t('tools.nlayers', { N: numLayers })})
                </h3>
                <div>
                    {step < numLayers
                        ? t('tools.modelPredicting')
                        : spinning
                        ? t('tools.modelUpdating')
                        : done
                        ? t('tools.modelComplete')
                        : t('tools.modelIdle')}
                </div>
            </div>
        </div>
    );
}
