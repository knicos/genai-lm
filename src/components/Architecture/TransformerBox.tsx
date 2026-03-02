import style from './style.module.css';

interface Props {
    hiddenSize: number;
    heads: number;
    y: number;
    height: number;
}

const HEAD_GAP = 10;
const WIDTH_SCALING = 2;
const BOX_PADDING = 10;

export default function TransformerBox({ hiddenSize, heads, y, height }: Props) {
    const width = hiddenSize * WIDTH_SCALING;
    const headWidth = (width - 2 * BOX_PADDING - (heads - 1) * HEAD_GAP) / heads;

    return (
        <g className={style.transformerBox}>
            <rect
                x={-width / 2}
                y={y}
                width={width}
                height={height}
                stroke="none"
                fill="white"
                strokeWidth={4}
            />
            {[...Array(heads)].map((_, i) => (
                <rect
                    key={i}
                    x={-width / 2 + BOX_PADDING + i * (headWidth + HEAD_GAP)}
                    y={y + BOX_PADDING}
                    rx={10}
                    width={headWidth}
                    height={height - 2 * BOX_PADDING}
                    className={style.box}
                />
            ))}
        </g>
    );
}
