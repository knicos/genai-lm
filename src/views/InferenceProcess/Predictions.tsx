import { PercentageBar } from '@genai-fi/base';
import style from './predictions.module.css';
import DoneIcon from '@mui/icons-material/Done';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import padPredictions from './paddedPredictions';
import Multinomial from './Multinomial';

const CURVE = 10;

interface ILine {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    flip: boolean;
    id: number;
}

interface Props {
    predictions: number[];
    vocab: string[];
    target?: number;
    size: number;
    finished: boolean;
    committed: boolean;
    inferenceMode?: boolean;
    multinomialRand: number | null;
    leftMargin?: number;
    rightMargin?: number;
}

export default function Predictions({
    predictions,
    vocab,
    target,
    size,
    finished,
    committed,
    inferenceMode,
    multinomialRand,
    leftMargin = 40,
    rightMargin = 40,
}: Props) {
    const { t } = useTranslation();
    const [lines, setLines] = useState<ILine[]>([]);
    const ref = useRef<HTMLDivElement>(null);
    const tableRef = useRef<HTMLTableElement>(null);
    const observer = useRef<ResizeObserver>(null);
    const [lineHeight, setLineHeight] = useState(30);

    const paddedPredictions = useMemo(() => {
        return padPredictions(predictions, vocab, size, finished ? (target ?? null) : null);
    }, [predictions, vocab, target, size, finished]);

    useLayoutEffect(() => {
        if (ref.current && tableRef.current) {
            const f = () => {
                if (ref.current && tableRef.current) {
                    const mainRect = ref.current.getBoundingClientRect();
                    const tableRect = tableRef.current.getBoundingClientRect();
                    const width = Math.floor(tableRect.left - mainRect.left);
                    const height = mainRect.height;
                    const rightEdge = mainRect.width - width + (inferenceMode ? -70 : 0);
                    const padding = 20;

                    const newLines: ILine[] = [];
                    const lineSpacing = (tableRect.height - padding) / size;
                    const startY = tableRect.y - mainRect.y - padding / 2;

                    if (width > 40) {
                        for (let i = 0; i < size; i++) {
                            newLines.push({
                                x1: leftMargin,
                                y1: 0,
                                x2: width,
                                y2: startY + padding + i * lineSpacing + lineSpacing / 2,
                                flip: false,
                                id: -1,
                            });
                        }

                        for (let i = 0; i < size; i++) {
                            newLines.push({
                                x1: rightEdge,
                                y1: startY + padding + i * lineSpacing + lineSpacing / 2,
                                x2: mainRect.width - rightMargin,
                                y2: height,
                                flip: true,
                                id: i,
                            });
                        }
                    }

                    setLineHeight(lineSpacing);
                    setLines(newLines);
                }
            };
            observer.current = new ResizeObserver(f);
            observer.current.observe(ref.current);
            observer.current.observe(tableRef.current);
            f();
        }
        return () => {
            observer.current?.disconnect();
        };
    }, [size, inferenceMode, leftMargin, rightMargin]);

    const showCorrect = inferenceMode ? committed : finished;

    return (
        <div
            className={style.section}
            ref={ref}
        >
            <svg
                className={style.linesSVG}
                xmlns="http://www.w3.org/2000/svg"
                width="100%"
                height="100%"
            >
                {lines.map((line, ix) => {
                    const isTarget = line.id >= 0 ? paddedPredictions[line.id].token === target : false;
                    return (
                        <path
                            key={ix}
                            d={`M ${line.x1} ${line.y1} C ${line.flip ? line.x2 - CURVE : line.x1} ${
                                line.flip ? line.y1 : line.y2 - CURVE
                            }, ${line.flip ? line.x2 : line.x1 + CURVE} ${line.flip ? line.y1 + CURVE : line.y2}, ${
                                line.x2
                            } ${line.y2}`}
                            fill="none"
                            stroke={
                                line.id === -1 || !committed
                                    ? 'white'
                                    : isTarget && committed
                                      ? theme.dark.success
                                      : !inferenceMode
                                        ? theme.dark.error
                                        : 'white'
                            }
                            strokeOpacity={inferenceMode ? (committed && !isTarget && line.id !== -1 ? 0.1 : 1.0) : 1.0}
                            strokeWidth="5"
                        />
                    );
                })}
            </svg>
            <div>
                <h4>{t('training.predictionsHeader')}</h4>
                <table
                    className={style.predictionsList}
                    ref={tableRef}
                >
                    <tbody>
                        {paddedPredictions.map((p, index) => (
                            <tr
                                key={index}
                                style={
                                    index === 0 && finished
                                        ? { backgroundColor: 'rgba(117, 164, 226, 0.2)' }
                                        : undefined
                                }
                            >
                                <td className={p.token === -1 ? style.noToken : style.token}>
                                    <span>{`${p.text}`}</span>
                                </td>
                                <td className={style.probability}>
                                    <PercentageBar
                                        value={p.probability * 100}
                                        colour={
                                            !showCorrect || p.token === -1
                                                ? 'blue'
                                                : p.token === target
                                                  ? 'green'
                                                  : 'blue'
                                        }
                                        thickness={10}
                                        hideLabel
                                        style={{ minHeight: '5px' }}
                                    />
                                </td>
                                <td className={style.percentage}>
                                    {p.token === -1 ? '' : `${Math.round(p.probability * 100)}%`}
                                </td>
                                <td className={style.icon}>
                                    {p.token >= 0 &&
                                        (!showCorrect ? (
                                            <HourglassEmptyIcon
                                                htmlColor="#5165c9"
                                                fontSize="small"
                                            />
                                        ) : p.token === target ? (
                                            <DoneIcon
                                                color="success"
                                                fontSize="small"
                                            />
                                        ) : null)}
                                    {p.token < 0 && null}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {inferenceMode && (
                <Multinomial
                    predictions={paddedPredictions}
                    lineHeight={lineHeight}
                    multinomialRand={finished ? multinomialRand : null}
                    target={finished ? target : undefined}
                />
            )}
        </div>
    );
}
