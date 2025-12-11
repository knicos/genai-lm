import { TeachableLLM } from '@genai-fi/nanogpt';
import Circle from '../../components/Clock/Circle';
import { lossToColor } from '../../utilities/colours';
import { createMetric } from '../../workflow/Evaluation/Evaluation';
import style from './style.module.css';
import { useTranslation } from 'react-i18next';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import { useEffect, useRef, useState } from 'react';

const CURVE = 10;
const ARROW_SIZE = 10;

interface Props {
    loss?: number;
    model: TeachableLLM;
    updating?: boolean;
}

interface ILine {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export default function LossBox({ loss, model, updating }: Props) {
    const { t } = useTranslation();
    const [line, setLine] = useState<ILine>({ x1: 0, y1: 0, x2: 0, y2: 0 });
    const ref = useRef<SVGSVGElement>(null);
    const metric = loss === undefined ? null : createMetric('loss', { loss }, model.config.vocabSize ?? 1);

    useEffect(() => {
        if (ref.current) {
            const resize = () => {
                const bbx = ref.current!.getBoundingClientRect();
                setLine({
                    x1: 40,
                    y1: 0,
                    x2: bbx.width,
                    y2: bbx.height / 2,
                });
            };
            const observer = new ResizeObserver(resize);
            observer.observe(ref.current);
            resize();
            return () => observer.disconnect();
        }
    }, []);

    return (
        <div className={style.lossBlock}>
            <svg
                ref={ref}
                className={style.linesSVG}
                xmlns="http://www.w3.org/2000/svg"
                width="100%"
                height="100%"
            >
                <path
                    d={`M ${line.x1} ${line.y1 + 5} C ${line.x1} ${line.y2 - CURVE}, ${line.x1 + CURVE} ${line.y2}, ${
                        line.x2
                    } ${line.y2}`}
                    fill="none"
                    stroke={updating ? '#5b68c2' : '#e8f0fe'}
                    strokeWidth="5"
                />
                <path
                    d={`M ${line.x1} ${line.y1} L ${line.x1 + ARROW_SIZE} ${line.y1 + ARROW_SIZE * 2} L ${
                        line.x1 - ARROW_SIZE
                    } ${line.y1 + ARROW_SIZE * 2} L ${line.x1} ${line.y1} Z`}
                    fill={updating ? '#5b68c2' : '#e8f0fe'}
                    stroke="none"
                />
            </svg>
            <h3>{t('tools.loss')}</h3>
            <Circle
                radius={40}
                progress={metric ? 1 - metric.percentage : 0}
                color={metric ? lossToColor(1 - metric.percentage) : 'gray'}
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
