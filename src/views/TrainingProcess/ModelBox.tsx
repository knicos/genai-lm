import style from './style.module.css';
import { useTranslation } from 'react-i18next';
import CircularProgress from '../../components/CircularProgress/CircularProgress';

interface Props {
    layers: number;
    step: number;
}

export default function ModelBox({ layers, step }: Props) {
    const { t } = useTranslation();

    const numLayers = layers;

    return (
        <div className={style.modelBlock}>
            <CircularProgress
                totalSteps={numLayers}
                step={step}
                radius={40}
            >
                {step}/{numLayers}
            </CircularProgress>
            <h3>{t('tools.model')}</h3>
        </div>
    );
}
