import ResizeableBox from './ResizeableBox';
import style from './style.module.css';
import { theme } from '../../theme';
import { vocabToWidth, widthToVocab } from './sizeUtils';
import { MouseEvent, PointerEvent } from 'react';

const BOX_INTERVAL = 10;

interface Props {
    vocabSize: number;
    height: number;
    y: number;
    onVocabSizeChange?: (next: number) => void;
    minWidth?: number;
    scaling?: number;
    snapping?: number;
    preLabel?: string;
    postLabel?: string;
    layered?: boolean;
    onClick?: (element: SVGGElement | null) => void;
    onHover?: (element: SVGGElement | null) => void;
    onLeave?: () => void;
}

const OFFSETX = 4;
const OFFSETY = 8;

export default function VocabBox({
    vocabSize,
    y,
    height,
    onVocabSizeChange,
    minWidth = 100,
    scaling = 1,
    snapping = 50,
    preLabel,
    postLabel,
    layered,
    onClick,
    onHover,
    onLeave,
}: Props) {
    const width = vocabToWidth(vocabSize);
    const x = -width / 2;

    // Keep marker count proportional to visual width (not raw vocab)
    const markerCount = Math.floor(width / BOX_INTERVAL);

    return (
        <ResizeableBox
            width={width}
            height={height}
            y={y}
            onWidthChange={(next: number) => onVocabSizeChange?.(widthToVocab(next))}
            minWidth={minWidth}
            scaling={scaling}
            snapping={snapping}
        >
            {layered && (
                <>
                    <rect
                        x={x + OFFSETX}
                        y={y + OFFSETY}
                        width={width}
                        height={height}
                        fill={theme.dark.chartColours[3]}
                        opacity={0.2}
                        rx={10}
                    />
                    <rect
                        x={x + OFFSETX * 2}
                        y={y + OFFSETY * 2}
                        width={width}
                        height={height}
                        fill={theme.dark.chartColours[3]}
                        opacity={0.2}
                        rx={10}
                    />
                    <rect
                        x={x + OFFSETX * 3}
                        y={y + OFFSETY * 3}
                        width={width}
                        height={height}
                        fill={theme.dark.chartColours[3]}
                        opacity={0.2}
                        rx={10}
                    />
                </>
            )}
            {preLabel && (
                <text
                    x={x}
                    y={y - height / 2}
                    textAnchor="start"
                    alignmentBaseline="middle"
                    className={style.vocabLabel}
                >
                    {preLabel}
                </text>
            )}
            <g
                className={style.transformerBox}
                onClick={(e: MouseEvent) => {
                    onClick?.(e.currentTarget as SVGGElement);
                }}
                onPointerEnter={(e: PointerEvent) => {
                    onHover?.(e.currentTarget as SVGGElement);
                }}
                onPointerLeave={() => {
                    onLeave?.();
                }}
            >
                <rect
                    x={x}
                    y={y}
                    rx={10}
                    width={width}
                    height={height}
                    className={style.box}
                    fill={theme.dark.chartColours[3]}
                />
                {Array.from({ length: markerCount }, (_, i) => i).map((i) => (
                    <rect
                        key={i}
                        x={x + i * BOX_INTERVAL + BOX_INTERVAL / 2}
                        y={y + height / 2}
                        width={BOX_INTERVAL / 2}
                        height={BOX_INTERVAL / 2}
                        fill="white"
                        opacity={0.3}
                    />
                ))}
            </g>
            {postLabel && (
                <text
                    x={x}
                    y={y + height + 30}
                    textAnchor="start"
                    alignmentBaseline="middle"
                    className={style.vocabLabel}
                >
                    {postLabel}
                </text>
            )}
        </ResizeableBox>
    );
}
