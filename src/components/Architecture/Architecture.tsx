import { MouseEvent, PointerEvent, Ref, useEffect, useImperativeHandle, useRef, useState, WheelEvent } from 'react';
import { calcAutoCamera, calculateViewBox, DEFAULT_EXTENTS, Mover, wheelZoom, ZoomState } from './camera';
import VocabBox from './VocabBox';
import style from './style.module.css';
import TransformerBoxes from './TransformerBoxes';
import { useAtom } from 'jotai';
import { modelConfigAtom } from '../../state/model';
import { Popper } from '@mui/material';
import LayerInfo from './LayerInfo';
import Flow from './Flow';
import { BLOCK_GAP, BLOCK_HEIGHT, endVocabStart, totalHeight, vocabToWidth } from './sizeUtils';

// const CAMERA_DURATION = 0.3;
const MOVE_THRESHOLD = 10;
const BUTTON_ZOOM_SPEED = 0.2;

export interface ArchitectureRef {
    zoomToFit: () => void;
    zoomIn: () => void;
    zoomOut: () => void;
}

export default function Architecture({ ref }: { ref: Ref<ArchitectureRef> }) {
    const [internalArchitecture, setInternalArchitecture] = useAtom(modelConfigAtom);
    const svgRef = useRef<SVGSVGElement>(null);
    const parentRef = useRef<HTMLDivElement>(null);
    const extents = useRef<[number, number, number, number]>([0, 0, 0, 0]);
    const [scaling, setScaling] = useState(1);
    const [anchor, setAnchor] = useState<SVGElement | null>(null);
    const [selectedLayer, setSelectedLayer] = useState<number>(-1);
    const mover = useRef<Mover | undefined>(undefined);
    const actualZoom = useRef<ZoomState>({
        zoom: 1,
        offsetX: 0.5,
        offsetY: 0.5,
        cx: 0,
        cy: 0,
        duration: 0,
    });
    const startY = totalHeight(internalArchitecture) / -2;

    const doCameraUpdate = (newZoom: ZoomState, noSetScaling?: boolean) => {
        actualZoom.current = newZoom;
        // Ensure aspect ratio is correct
        if (svgRef.current) {
            const width = svgRef.current.clientWidth;
            const height = svgRef.current.clientHeight;
            const ratio = height / width;
            const h = (DEFAULT_EXTENTS.maxX - DEFAULT_EXTENTS.minX) * ratio;
            DEFAULT_EXTENTS.maxY = h / 2;
            DEFAULT_EXTENTS.minY = -h / 2;

            const newExtents = calculateViewBox(DEFAULT_EXTENTS, newZoom);
            extents.current = newExtents;
            if (!noSetScaling) {
                setScaling(newExtents[2] / width);
            }
            /*gsap.to(svgRef.current, {
            attr: {
                viewBox: `${Math.floor(newExtents[0])} ${Math.floor(newExtents[1])} ${Math.floor(
                    newExtents[2]
                )} ${Math.floor(newExtents[3])}`,
            },
            duration: actualZoom.duration,
            //ease: 'none',
        });*/
            svgRef.current.setAttribute(
                'viewBox',
                `${Math.floor(newExtents[0])} ${Math.floor(newExtents[1])} ${Math.floor(newExtents[2])} ${Math.floor(newExtents[3])}`
            );
        }
    };

    useEffect(() => {
        const startY = totalHeight(internalArchitecture) / -2;

        doCameraUpdate(
            calcAutoCamera({
                minX:
                    Math.max(vocabToWidth(internalArchitecture.vocabSize), internalArchitecture.nEmbed * 2) / -2 - 100,
                minY: startY - 50,
                maxX: Math.max(vocabToWidth(internalArchitecture.vocabSize), internalArchitecture.nEmbed * 2) / 2 + 100,
                maxY: -startY + 50,
            })
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // FIXME: Correct but is there a better way?

    useImperativeHandle(ref, () => ({
        zoomToFit: () => {
            const startY = totalHeight(internalArchitecture) / -2;

            doCameraUpdate(
                calcAutoCamera({
                    minX:
                        Math.max(vocabToWidth(internalArchitecture.vocabSize), internalArchitecture.nEmbed * 2) / -2 -
                        100,
                    minY: startY - 50,
                    maxX:
                        Math.max(vocabToWidth(internalArchitecture.vocabSize), internalArchitecture.nEmbed * 2) / 2 +
                        100,
                    maxY: -startY + 50,
                })
            );
        },
        zoomIn: () => {
            doCameraUpdate({
                ...actualZoom.current,
                zoom: Math.min(2, actualZoom.current.zoom - BUTTON_ZOOM_SPEED * actualZoom.current.zoom),
            });
        },
        zoomOut: () => {
            doCameraUpdate({
                ...actualZoom.current,
                zoom: Math.max(0.5, actualZoom.current.zoom + BUTTON_ZOOM_SPEED * actualZoom.current.zoom),
            });
        },
    }));

    return (
        <div
            className={style.container}
            ref={parentRef}
        >
            <Popper
                open={!!anchor}
                anchorEl={anchor}
                placement="right"
                modifiers={[
                    {
                        name: 'offset',
                        options: {
                            offset: (popper: { reference: { x: number; width: number } }) => {
                                if (svgRef.current) {
                                    const rect = svgRef.current.getBoundingClientRect();
                                    const offsetX = rect.right - popper.reference.x - popper.reference.width;
                                    return [0, offsetX];
                                }
                                return [0, 0];
                            },
                        },
                    },
                ]}
            >
                <LayerInfo
                    index={selectedLayer}
                    hiddenSize={internalArchitecture?.nEmbed || 0}
                />
            </Popper>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="-500 500 1000 1000"
                width="100%"
                height="100%"
                ref={svgRef}
                className={style.svg}
                onClickCapture={(e: MouseEvent<SVGSVGElement>) => {
                    if (mover.current && Math.max(mover.current.movementX, mover.current.movementY) > MOVE_THRESHOLD) {
                        mover.current = undefined;
                        e.stopPropagation();
                        return;
                    }
                    //if (onUnselect && focusNode && e.target === e.currentTarget) onUnselect();
                    mover.current = undefined;
                }}
                onPointerMove={(e: PointerEvent<SVGSVGElement>) => {
                    const pressed = e.pointerType === 'touch' || e.buttons === 1;
                    if (pressed && svgRef.current) {
                        if (!mover.current) {
                            mover.current = new Mover(actualZoom.current, extents.current, svgRef.current);
                            setSelectedLayer(-1);
                            setAnchor(null);
                        }
                        doCameraUpdate(mover.current.move(e), true);
                    }
                }}
                onPointerUp={(e: PointerEvent<SVGSVGElement>) => {
                    //pointerCache.current.clear();
                    //if (e.pointerType === 'touch') movement.current = [0, 0];
                    if (e.pointerType === 'touch') mover.current = undefined;
                    //if (onDragStop) onDragStop();
                }}
                onWheel={(e: WheelEvent<SVGSVGElement>) => {
                    if (svgRef.current) {
                        doCameraUpdate(wheelZoom(e, svgRef.current, extents.current, actualZoom.current));
                    }
                }}
            >
                <Flow
                    config={internalArchitecture}
                    startY={startY}
                    height={BLOCK_HEIGHT}
                    gap={BLOCK_GAP}
                />

                <VocabBox
                    vocabSize={internalArchitecture?.vocabSize || 0}
                    y={startY}
                    height={BLOCK_HEIGHT / 2}
                    onVocabSizeChange={(next: number) =>
                        setInternalArchitecture((old) => ({ ...old, vocabSize: next }))
                    }
                    scaling={scaling}
                    preLabel="Input Context"
                    layered
                    onClick={(element) => {
                        setAnchor(element);
                        setSelectedLayer(-1);
                    }}
                    onHover={(element) => {
                        if (mover.current) return;
                        setAnchor(element);
                        setSelectedLayer(-1);
                    }}
                    onLeave={() => {
                        setAnchor(null);
                    }}
                />
                <TransformerBoxes
                    layers={internalArchitecture?.nLayer ?? 0}
                    hiddenSize={internalArchitecture?.nEmbed ?? 0}
                    heads={internalArchitecture?.nHead ?? 0}
                    y={startY + BLOCK_HEIGHT / 2 + BLOCK_GAP}
                    height={BLOCK_HEIGHT}
                    gap={BLOCK_GAP}
                    scaling={scaling}
                    showNumbers={internalArchitecture.nLayer < 12 && actualZoom.current.zoom < 3}
                    onChangeHiddenSize={(next: number) => setInternalArchitecture((old) => ({ ...old, nEmbed: next }))}
                    onChangeLayers={(next: number) => setInternalArchitecture((old) => ({ ...old, nLayer: next }))}
                    onLayerClick={(index, element) => {
                        setAnchor(element);
                        setSelectedLayer(index);
                    }}
                    onLayerHover={(index, element) => {
                        if (mover.current) return;
                        setAnchor(element);
                        setSelectedLayer(index);
                    }}
                    onLayerLeave={() => {
                        setAnchor(null);
                        setSelectedLayer(-1);
                    }}
                />
                <VocabBox
                    vocabSize={internalArchitecture?.vocabSize || 0}
                    y={endVocabStart(
                        startY,
                        internalArchitecture || {
                            nLayer: 0,
                        }
                    )}
                    height={BLOCK_HEIGHT / 2}
                    onVocabSizeChange={(next: number) =>
                        setInternalArchitecture((old) => ({ ...old, vocabSize: next }))
                    }
                    scaling={scaling}
                    postLabel="Output Probabilities"
                    onClick={(element) => {
                        setAnchor(element);
                        setSelectedLayer(-1);
                    }}
                    onHover={(element) => {
                        if (mover.current) return;
                        setAnchor(element);
                        setSelectedLayer(-1);
                    }}
                    onLeave={() => {
                        setAnchor(null);
                    }}
                />
            </svg>
        </div>
    );
}
