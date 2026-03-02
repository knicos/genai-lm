import TransformerBox from './TransformerBox';
import ResizeableBox from './ResizeableBox';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import style from './style.module.css';

const WIDTH_SCALING = 2;
export const BAR_BUTTON_SIZE = 40;

interface Props {
    layers: number;
    hiddenSize: number;
    heads: number;
    height: number;
    gap: number;
    y: number;
    scaling?: number;
    onChangeHiddenSize?: (next: number) => void;
    onChangeHeads?: (next: number) => void;
    onChangeLayers?: (next: number) => void;
}

export default function TransformerBoxes({
    layers,
    hiddenSize,
    heads,
    height,
    gap,
    y,
    scaling,
    onChangeHiddenSize,
    onChangeHeads,
    onChangeLayers,
}: Props) {
    const width = hiddenSize * WIDTH_SCALING;

    const addLayerButtonY = y + layers * (height + gap) - gap + (BAR_BUTTON_SIZE + 10);

    return (
        <ResizeableBox
            y={y}
            width={width + (BAR_BUTTON_SIZE + 10) * 2}
            height={height * layers + gap * (layers - 1) + (BAR_BUTTON_SIZE + 10) * 2}
            scaling={scaling}
            onWidthChange={(next: number) => onChangeHiddenSize?.(next / WIDTH_SCALING)}
            snapping={32 * heads * WIDTH_SCALING}
            minWidth={32 * heads * WIDTH_SCALING}
        >
            <g
                onClick={() => onChangeLayers?.(Math.max(1, layers - 1))}
                className={style.tableButton}
            >
                <rect
                    x={-width / 2}
                    y={y}
                    width={width}
                    height={BAR_BUTTON_SIZE}
                />
                <foreignObject
                    x={-width / 2}
                    y={y}
                    width={width}
                    height={BAR_BUTTON_SIZE}
                >
                    <div className={style.iconContainer}>
                        <RemoveIcon fontSize="inherit" />
                    </div>
                </foreignObject>
            </g>
            <g
                onClick={() => onChangeHeads?.(Math.max(1, heads - 1))}
                className={style.tableButton}
            >
                <rect
                    x={-width / 2 - 10 - BAR_BUTTON_SIZE}
                    y={y}
                    height={addLayerButtonY - y + BAR_BUTTON_SIZE + 10}
                    width={BAR_BUTTON_SIZE}
                />
                <foreignObject
                    x={-width / 2 - 10 - BAR_BUTTON_SIZE}
                    y={y}
                    width={BAR_BUTTON_SIZE}
                    height={addLayerButtonY - y + BAR_BUTTON_SIZE + 10}
                >
                    <div className={style.iconContainer}>
                        <RemoveIcon fontSize="inherit" />
                    </div>
                </foreignObject>
            </g>
            {Array(layers)
                .fill(0)
                .map((_, i) => (
                    <TransformerBox
                        key={i}
                        hiddenSize={hiddenSize}
                        heads={heads}
                        y={y + i * (height + gap) + (BAR_BUTTON_SIZE + 10)}
                        height={height}
                    />
                ))}
            <g
                onClick={() => onChangeLayers?.(Math.min(24, layers + 1))}
                className={style.tableButton}
            >
                <rect
                    x={-width / 2}
                    y={addLayerButtonY + 10}
                    width={width}
                    height={BAR_BUTTON_SIZE}
                />
                <foreignObject
                    x={-width / 2}
                    y={addLayerButtonY + 10}
                    width={width}
                    height={BAR_BUTTON_SIZE}
                >
                    <div className={style.iconContainer}>
                        <AddIcon fontSize="inherit" />
                    </div>
                </foreignObject>
            </g>
            <g
                onClick={() => onChangeHeads?.(Math.min(16, heads + 1))}
                className={style.tableButton}
            >
                <rect
                    x={width / 2 + 10}
                    y={y}
                    height={addLayerButtonY - y + BAR_BUTTON_SIZE + 10}
                    width={BAR_BUTTON_SIZE}
                />
                <foreignObject
                    x={width / 2 + 10}
                    y={y}
                    width={BAR_BUTTON_SIZE}
                    height={addLayerButtonY - y + BAR_BUTTON_SIZE + 10}
                >
                    <div className={style.iconContainer}>
                        <AddIcon fontSize="inherit" />
                    </div>
                </foreignObject>
            </g>
        </ResizeableBox>
    );
}
