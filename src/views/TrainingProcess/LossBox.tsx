import { TeachableLLM } from '@genai-fi/nanogpt';
import Circle from '../../components/Clock/Circle';
import { qualityToColor } from '../../utilities/colours';
import { createMetric } from '../../workflow/Evaluation/Evaluation';
import style from './style.module.css';
import { useTranslation } from 'react-i18next';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';

interface Props {
    loss?: number;
    model: TeachableLLM;
}

export default function LossBox({ loss, model }: Props) {
    const { t } = useTranslation();
    const metric = loss === undefined ? null : createMetric('loss', { loss }, model.config.vocabSize ?? 1);

    return (
        <div className={style.lossBlock}>
            <h3>{t('tools.loss')}</h3>
            <Circle
                radius={40}
                progress={metric ? metric.percentage : 0}
                color={metric ? qualityToColor(metric.percentage) : 'gray'}
                animated
            >
                {metric ? (
                    metric.value.toFixed(2)
                ) : (
                    <HourglassTopIcon
                        htmlColor="#5165c960"
                        fontSize="large"
                    />
                )}
            </Circle>
        </div>
    );
}
