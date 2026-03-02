import { PropsWithChildren, useRef } from 'react';
import style from './style.module.css';

interface Props extends PropsWithChildren {
    width: number;
    height: number;
    y: number;
    onWidthChange?: (next: number) => void;
    minWidth?: number;
    handleWidth?: number;
    scaling?: number;
    snapping?: number;
}

type Edge = 'left' | 'right';

const HANDLE_PADDING = 40;
const HANDLE_WIDTH = 4;

export default function ResizeableBox({
    width,
    y,
    height,
    onWidthChange,
    children,
    minWidth = 40,
    handleWidth = HANDLE_WIDTH,
    scaling = 1,
    snapping = 50,
}: Props) {
    const dragRef = useRef<{
        edge: Edge;
        startX: number;
        startWidth: number;
    } | null>(null);

    const startDrag = (edge: Edge) => (e: React.PointerEvent<SVGElement>) => {
        if (!onWidthChange) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        dragRef.current = {
            edge,
            startX: e.clientX,
            startWidth: width,
        };
    };

    const onDrag = (e: React.PointerEvent<SVGElement>) => {
        if (!dragRef.current || !onWidthChange) return;

        const { edge, startX, startWidth } = dragRef.current;
        const dx = (e.clientX - startX) * scaling * 2;

        const nextWidth = Math.floor(edge === 'right' ? startWidth + dx : startWidth - dx);
        // Snap to the specified number of tokens
        const snappedWidth = Math.round(nextWidth / snapping) * snapping;
        onWidthChange(Math.max(minWidth, snappedWidth));
    };

    const endDrag = () => {
        dragRef.current = null;
    };

    const x = -width / 2;
    const leftHandleX = x - handleWidth - HANDLE_PADDING; // / 2;
    const rightHandleX = x + width + HANDLE_PADDING; // - handleWidth / 2;

    return (
        <g className={style.resizeableBox}>
            {children}

            {/* Left resize handle */}
            <g
                transform={`translate(${leftHandleX}, ${y + HANDLE_PADDING / 2})`}
                className={style.handleGroup}
            >
                <rect
                    x={-handleWidth * 4}
                    y={0}
                    width={handleWidth * 8}
                    height={height - HANDLE_PADDING}
                    className={style.handleBg}
                />
                <rect
                    x={0}
                    y={0}
                    width={handleWidth}
                    height={height - HANDLE_PADDING}
                    className={style.handleBar}
                    onPointerDown={startDrag('left')}
                    onPointerMove={onDrag}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                />
                <circle
                    cx={handleWidth / 2}
                    cy={(height - HANDLE_PADDING) / 2}
                    r={handleWidth * 4}
                    fill="white"
                    stroke="black"
                    strokeWidth={2}
                    className={style.handle}
                    onPointerDown={startDrag('left')}
                    onPointerMove={onDrag}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                />
            </g>

            {/* Right resize handle */}
            <g
                transform={`translate(${rightHandleX}, ${y + HANDLE_PADDING / 2})`}
                className={style.handleGroup}
            >
                <rect
                    x={-handleWidth * 4}
                    y={0}
                    width={handleWidth * 8}
                    height={height - HANDLE_PADDING}
                    className={style.handleBg}
                />
                <rect
                    x={0}
                    y={0}
                    width={handleWidth}
                    height={height - HANDLE_PADDING}
                    className={style.handleBar}
                    onPointerDown={startDrag('right')}
                    onPointerMove={onDrag}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                />
                <circle
                    cx={handleWidth / 2}
                    cy={(height - HANDLE_PADDING) / 2}
                    r={handleWidth * 4}
                    fill="white"
                    stroke="black"
                    strokeWidth={2}
                    className={style.handle}
                    onPointerDown={startDrag('right')}
                    onPointerMove={onDrag}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                />
            </g>
        </g>
    );
}
