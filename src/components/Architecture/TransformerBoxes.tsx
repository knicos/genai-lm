import TransformerBox from './TransformerBox';
import ResizeableBox from './ResizeableBox';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import style from './style.module.css';
import { BAR_BUTTON_SIZE, BAR_BUTTON_SPACING } from './sizeUtils';

const WIDTH_SCALING = 2;

interface Props {
    layers: number;
    hiddenSize: number;
    heads: number;
    height: number;
    gap: number;
    y: number;
    scaling?: number;
    showNumbers?: boolean;
    onChangeHiddenSize?: (next: number) => void;
    onChangeLayers?: (next: number) => void;
    onLayerClick?: (index: number, element: SVGGElement | null) => void;
    onLayerHover?: (index: number, element: SVGGElement | null) => void;
    onLayerLeave?: (index: number) => void;
}

export default function TransformerBoxes({
    layers,
    hiddenSize,
    heads,
    height,
    gap,
    y,
    scaling,
    showNumbers,
    onChangeHiddenSize,
    onChangeLayers,
    onLayerClick,
    onLayerHover,
    onLayerLeave,
}: Props) {
    const width = hiddenSize * WIDTH_SCALING;

    const addLayerButtonY = y + layers * (height + gap) - gap + (BAR_BUTTON_SIZE + BAR_BUTTON_SPACING);

    return (
        <ResizeableBox
            y={y}
            width={width}
            height={height * layers + gap * (layers - 1) + (BAR_BUTTON_SIZE + BAR_BUTTON_SPACING) * 2}
            scaling={scaling}
            onWidthChange={(next: number) => onChangeHiddenSize?.(next / WIDTH_SCALING)}
            snapping={32 * heads * WIDTH_SCALING}
            minWidth={32 * heads * WIDTH_SCALING}
        >
            <g
                onClick={() => onChangeLayers?.(Math.max(1, layers - 1))}
                className={style.tableButton}
            >
                <circle
                    cx={0}
                    cy={y + BAR_BUTTON_SIZE / 2}
                    r={BAR_BUTTON_SIZE * 0.75}
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
            {Array(layers)
                .fill(0)
                .map((_, i) => (
                    <TransformerBox
                        key={i}
                        index={i}
                        hiddenSize={hiddenSize}
                        y={y + i * (height + gap) + (BAR_BUTTON_SIZE + BAR_BUTTON_SPACING)}
                        height={height}
                        showNumbers={showNumbers}
                        onLayerClick={onLayerClick}
                        onLayerHover={onLayerHover}
                        onLayerLeave={onLayerLeave}
                    />
                ))}
            <g
                onClick={() => onChangeLayers?.(Math.min(128, layers + 1))}
                className={style.tableButton}
            >
                <circle
                    cx={0}
                    cy={addLayerButtonY + BAR_BUTTON_SPACING + BAR_BUTTON_SIZE / 2}
                    r={BAR_BUTTON_SIZE * 0.75}
                />
                <foreignObject
                    x={-width / 2}
                    y={addLayerButtonY + BAR_BUTTON_SPACING}
                    width={width}
                    height={BAR_BUTTON_SIZE}
                >
                    <div className={style.iconContainer}>
                        <AddIcon fontSize="inherit" />
                    </div>
                </foreignObject>
            </g>
        </ResizeableBox>
    );
}
