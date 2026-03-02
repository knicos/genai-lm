import ResizeableBox from './ResizeableBox';
import style from './style.module.css';

const WIDTH_SCALING = 1;

interface Props {
    vocabSize: number;
    height: number;
    y: number;
    onVocabSizeChange?: (next: number) => void;
    minWidth?: number;
    scaling?: number;
    snapping?: number;
}

export default function VocabBox({
    vocabSize,
    y,
    height,
    onVocabSizeChange,
    minWidth = 40,
    scaling = 1,
    snapping = 50,
}: Props) {
    const width = vocabSize * WIDTH_SCALING;
    const x = -width / 2;

    return (
        <ResizeableBox
            width={width}
            height={height}
            y={y}
            onWidthChange={(next: number) => onVocabSizeChange?.(next / WIDTH_SCALING)}
            minWidth={minWidth}
            scaling={scaling}
            snapping={snapping}
        >
            <rect
                x={x}
                y={y}
                rx={10}
                width={width}
                height={height}
                className={style.box}
            />
            <text
                x={0}
                y={y + height / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#444"
                fontSize={42}
            >
                Vocab: {vocabSize}
            </text>
        </ResizeableBox>
    );
}
