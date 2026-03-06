import { MouseEvent, useMemo } from 'react';
import style from './style.module.css';
import { theme } from '../../theme';

interface Props {
    index: number;
    hiddenSize: number;
    y: number;
    height: number;
    showNumbers?: boolean;
    onLayerClick?: (index: number, element: SVGGElement | null) => void;
    onLayerHover?: (index: number, element: SVGGElement | null) => void;
    onLayerLeave?: (index: number) => void;
}

const WIDTH_SCALING = 2;

export default function TransformerBox({
    hiddenSize,
    y,
    height,
    onLayerClick,
    onLayerHover,
    onLayerLeave,
    index,
    showNumbers,
}: Props) {
    const width = hiddenSize * WIDTH_SCALING;

    const randomNumbers = useMemo(() => {
        if (!showNumbers) return [];
        const countX = Math.floor(width / 32);
        const countY = Math.floor(height / 32);
        const numbers: { value: number; x: number; y: number }[] = [];
        for (let y = 0; y < countY; y++) {
            for (let x = 0; x < countX; x++) {
                numbers.push({
                    // eslint-disable-next-line react-hooks/purity
                    value: Math.random() * 5,
                    x: x * (width / countX) - width / 2 + width / (countX * 2),
                    y: y * (height / countY) - height / 2 + height / (countY * 2),
                });
            }
        }
        return numbers;
    }, [width, height, showNumbers]);

    return (
        <g
            className={style.transformerBox}
            onClick={(e: MouseEvent) => {
                onLayerClick?.(index, e.currentTarget as SVGGElement);
            }}
            onPointerEnter={(e: MouseEvent) => {
                onLayerHover?.(index, e.currentTarget as SVGGElement);
            }}
            onPointerLeave={() => {
                onLayerLeave?.(index);
            }}
        >
            <rect
                x={-width / 2}
                y={y}
                width={width}
                height={height}
                className={style.box}
                rx={10}
                fill={theme.dark.chartColours[3]}
            />
            {randomNumbers.map((num, i) => (
                <text
                    key={i}
                    x={num.x}
                    y={num.y + y + height / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="white"
                    opacity={0.6 * (num.value / 5)}
                    fontSize={16}
                >
                    {num.value.toFixed(1)}
                </text>
            ))}
        </g>
    );
}
