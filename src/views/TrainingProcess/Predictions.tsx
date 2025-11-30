import { PercentageBar } from '@genai-fi/base';
import style from './predictions.module.css';
import DoneIcon from '@mui/icons-material/Done';
import CloseIcon from '@mui/icons-material/Close';
import { useEffect, useMemo, useRef, useState } from 'react';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import filterTokens from './filterTokens';

const CURVE = 10;

interface ILine {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    flip: boolean;
}

interface Props {
    predictions: number[];
    vocab: string[];
    target?: number;
    size: number;
    finished: boolean;
}

export default function Predictions({ predictions, vocab, target, size, finished }: Props) {
    const [lines, setLines] = useState<ILine[]>([]);
    const ref = useRef<HTMLDivElement>(null);
    const tableRef = useRef<HTMLTableElement>(null);
    const observer = useRef<ResizeObserver>(null);

    const paddedPredictions = useMemo(() => {
        if (predictions.length === 0) {
            return Array(size).fill({ token: -1, text: '', probability: 0 });
        }
        const filtered = filterTokens(vocab, predictions);
        filtered.sort((a, b) => b.probability - a.probability);
        const sliced = filtered.slice(0, 6);
        if (finished) {
            const hasTarget = sliced.find((p) => p.token === target);
            if (!hasTarget) {
                sliced.pop();
                sliced.push({
                    token: target ?? 0,
                    text: vocab[target ?? 0],
                    probability: predictions[target ?? 0],
                });
            }
        }
        const paddedPredictions =
            sliced.length < size
                ? [...sliced, ...Array(size - sliced.length).fill({ token: -1, text: '', probability: 0 })]
                : sliced;
        return paddedPredictions;
    }, [predictions, vocab, target, size, finished]);

    useEffect(() => {
        if (ref.current && tableRef.current) {
            const f = () => {
                if (ref.current && tableRef.current) {
                    const mainRect = ref.current.getBoundingClientRect();
                    const tableRect = tableRef.current.getBoundingClientRect();
                    const width = Math.floor((mainRect.width - tableRect.width) / 2);
                    const height = mainRect.height;
                    const rightEdge = mainRect.width - width;
                    const padding = 20;

                    const newLines: ILine[] = [];
                    const lineSpacing = tableRect!.height / size;

                    if (width > 40) {
                        for (let i = 0; i < size; i++) {
                            newLines.push({
                                x1: 40,
                                y1: 0,
                                x2: width,
                                y2: padding + i * lineSpacing + lineSpacing / 2,
                                flip: false,
                            });
                        }

                        for (let i = 0; i < size; i++) {
                            newLines.push({
                                x1: rightEdge,
                                y1: padding + i * lineSpacing + lineSpacing / 2,
                                x2: mainRect.width - 40,
                                y2: height,
                                flip: true,
                            });
                        }
                    }

                    setLines(newLines);
                }
            };
            observer.current = new ResizeObserver(f);
            observer.current.observe(ref.current);
            observer.current.observe(tableRef.current);
        }
        return () => {
            observer.current?.disconnect();
        };
    }, [size]);

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
                    return (
                        <path
                            key={ix}
                            d={`M ${line.x1} ${line.y1} C ${line.flip ? line.x2 - CURVE : line.x1} ${
                                line.flip ? line.y1 : line.y2 - CURVE
                            }, ${line.flip ? line.x2 : line.x1 + CURVE} ${line.flip ? line.y1 + CURVE : line.y2}, ${
                                line.x2
                            } ${line.y2}`}
                            fill="none"
                            stroke="#e8f0fe"
                            strokeWidth="5"
                        />
                    );
                })}
            </svg>
            <table
                className={style.predictionsList}
                ref={tableRef}
            >
                <tbody>
                    {paddedPredictions.map((p, index) => (
                        <tr key={index}>
                            <td className={p.token === -1 ? style.noToken : style.token}>
                                <span>{`${p.text}`}</span>
                            </td>
                            <td className={style.probability}>
                                <PercentageBar
                                    value={p.probability * 100}
                                    colour={!finished || p.token === -1 ? 'blue' : p.token === target ? 'green' : 'red'}
                                    thickness={10}
                                    hideLabel
                                    style={{ minHeight: '5px' }}
                                />
                            </td>
                            <td className={style.percentage}>{Math.round(p.probability * 100)}%</td>
                            <td className={style.icon}>
                                {p.token >= 0 &&
                                    (!finished ? (
                                        <HourglassTopIcon
                                            htmlColor="#5165c9"
                                            fontSize="small"
                                        />
                                    ) : p.token === target ? (
                                        <DoneIcon
                                            color="success"
                                            fontSize="small"
                                        />
                                    ) : (
                                        <CloseIcon
                                            color="error"
                                            fontSize="small"
                                        />
                                    ))}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
