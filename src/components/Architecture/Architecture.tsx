import {
    useCallback,
    MouseEvent,
    PointerEvent,
    Ref,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
    WheelEvent,
    CSSProperties,
} from 'react';
import { useTranslation } from 'react-i18next';
import { calcAutoCamera, calculateViewBox, DEFAULT_EXTENTS, Mover, wheelZoom, ZoomState } from './camera';
import VocabBox from './VocabBox';
import style from './style.module.css';
import TransformerBoxes from './TransformerBoxes';
import { ExtendedConfig } from '../../state/model';
import LayerInfo from './LayerInfo';
import Flow from './Flow';
import { BLOCK_GAP, BLOCK_HEIGHT, endVocabStart, totalHeight } from './sizeUtils';
import InfoPop from '../InfoPop/InfoPop';

// const CAMERA_DURATION = 0.3;
const MOVE_THRESHOLD = 10;
const BUTTON_ZOOM_SPEED = 0.2;

export interface ArchitectureRef {
    zoomToFit: () => void;
    zoomIn: () => void;
    zoomOut: () => void;
}

interface Props {
    ref?: Ref<ArchitectureRef>;
    noLabels?: boolean;
    autoFit?: boolean;
    style?: CSSProperties;
    architecture: ExtendedConfig;
    onChange?: (architecture: ExtendedConfig) => void;
}

export default function Architecture({ ref, noLabels, autoFit, style: customStyle, architecture, onChange }: Props) {
    const { t } = useTranslation();
    const svgRef = useRef<SVGSVGElement>(null);
    const contentRef = useRef<SVGGElement>(null);
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
    const startY = totalHeight(architecture) / -2;
    const noControls = !onChange;

    const doCameraUpdate = useCallback((newZoom: ZoomState, noSetScaling?: boolean) => {
        actualZoom.current = newZoom;
        // Ensure aspect ratio is correct
        if (svgRef.current) {
            const width = svgRef.current.clientWidth;
            const height = svgRef.current.clientHeight;
            if (!width || !height) return;

            const ratio = height / width;
            const w = DEFAULT_EXTENTS.maxX - DEFAULT_EXTENTS.minX;
            const h = w * ratio;
            const viewportExtents = {
                minX: DEFAULT_EXTENTS.minX,
                maxX: DEFAULT_EXTENTS.maxX,
                minY: -h / 2,
                maxY: h / 2,
            };

            const newExtents = calculateViewBox(viewportExtents, newZoom);
            extents.current = newExtents;
            if (!noSetScaling) {
                setScaling(newExtents[2] / width);
            }

            svgRef.current.setAttribute(
                'viewBox',
                `${Math.floor(newExtents[0])} ${Math.floor(newExtents[1])} ${Math.floor(newExtents[2])} ${Math.floor(newExtents[3])}`
            );
        }
    }, []);

    const zoomToFitContent = useCallback(() => {
        const content = contentRef.current;
        if (!content) return;

        const box = content.getBBox();
        if (!box.width || !box.height) return;

        const MARGIN = 24;
        doCameraUpdate(
            calcAutoCamera({
                minX: box.x - MARGIN,
                minY: box.y - MARGIN,
                maxX: box.x + box.width + MARGIN,
                maxY: box.y + box.height + MARGIN,
            })
        );
    }, [doCameraUpdate]);

    useEffect(() => {
        zoomToFitContent();
    }, [zoomToFitContent]);

    useEffect(() => {
        if (!autoFit) return;
        zoomToFitContent();
    }, [autoFit, architecture, zoomToFitContent]);

    useImperativeHandle(ref, () => ({
        zoomToFit: () => {
            zoomToFitContent();
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
            style={customStyle}
        >
            <InfoPop
                open={!!anchor}
                anchorEl={anchor}
                placement="right"
                style={{ zIndex: 10000 }}
            >
                <LayerInfo
                    arch={architecture}
                    index={selectedLayer}
                    hiddenSize={architecture?.nEmbed || 0}
                />
            </InfoPop>
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
                onPointerMove={
                    noControls
                        ? undefined
                        : (e: PointerEvent<SVGSVGElement>) => {
                              const pressed = e.pointerType === 'touch' || e.buttons === 1;
                              if (pressed && svgRef.current) {
                                  if (!mover.current) {
                                      mover.current = new Mover(actualZoom.current, extents.current, svgRef.current);
                                      setSelectedLayer(-1);
                                      setAnchor(null);
                                  }
                                  doCameraUpdate(mover.current.move(e), true);
                              }
                          }
                }
                onPointerUp={
                    noControls
                        ? undefined
                        : (e: PointerEvent<SVGSVGElement>) => {
                              //pointerCache.current.clear();
                              //if (e.pointerType === 'touch') movement.current = [0, 0];
                              if (e.pointerType === 'touch') mover.current = undefined;
                              //if (onDragStop) onDragStop();
                          }
                }
                onWheel={
                    noControls
                        ? undefined
                        : (e: WheelEvent<SVGSVGElement>) => {
                              if (svgRef.current) {
                                  doCameraUpdate(wheelZoom(e, svgRef.current, extents.current, actualZoom.current));
                              }
                          }
                }
            >
                <g ref={contentRef}>
                    <Flow
                        config={architecture}
                        startY={startY}
                        height={BLOCK_HEIGHT}
                        gap={BLOCK_GAP}
                    />

                    <VocabBox
                        vocabSize={architecture?.vocabSize || 0}
                        y={startY}
                        height={BLOCK_HEIGHT / 2}
                        onVocabSizeChange={
                            !onChange ? undefined : (next: number) => onChange({ ...architecture, vocabSize: next })
                        }
                        scaling={scaling}
                        preLabel={noLabels ? undefined : t('model.inputContext')}
                        layered
                        onClick={
                            noControls
                                ? undefined
                                : (element) => {
                                      setAnchor(element);
                                      setSelectedLayer(-1);
                                  }
                        }
                        onHover={
                            noControls
                                ? undefined
                                : (element) => {
                                      if (mover.current) return;
                                      setAnchor(element);
                                      setSelectedLayer(-1);
                                  }
                        }
                        onLeave={
                            noControls
                                ? undefined
                                : () => {
                                      setAnchor(null);
                                  }
                        }
                    />
                    <TransformerBoxes
                        layers={architecture?.nLayer ?? 0}
                        hiddenSize={architecture?.nEmbed ?? 0}
                        heads={architecture?.nHead ?? 0}
                        y={startY + BLOCK_HEIGHT / 2 + BLOCK_GAP}
                        height={BLOCK_HEIGHT}
                        gap={BLOCK_GAP}
                        scaling={scaling}
                        showNumbers={architecture.nLayer < 12 && actualZoom.current.zoom < 3}
                        onChangeHiddenSize={
                            !onChange ? undefined : (next: number) => onChange({ ...architecture, nEmbed: next })
                        }
                        onChangeLayers={
                            !onChange ? undefined : (next: number) => onChange({ ...architecture, nLayer: next })
                        }
                        onLayerClick={
                            noControls
                                ? undefined
                                : (index, element) => {
                                      setAnchor(element);
                                      setSelectedLayer(index);
                                  }
                        }
                        onLayerHover={
                            noControls
                                ? undefined
                                : (index, element) => {
                                      if (mover.current) return;
                                      setAnchor(element);
                                      setSelectedLayer(index);
                                  }
                        }
                        onLayerLeave={
                            noControls
                                ? undefined
                                : () => {
                                      setAnchor(null);
                                      setSelectedLayer(-1);
                                  }
                        }
                    />
                    <VocabBox
                        vocabSize={architecture?.vocabSize || 0}
                        y={endVocabStart(
                            startY,
                            architecture || {
                                nLayer: 0,
                            }
                        )}
                        height={BLOCK_HEIGHT / 2}
                        onVocabSizeChange={
                            !onChange ? undefined : (next: number) => onChange({ ...architecture, vocabSize: next })
                        }
                        scaling={scaling}
                        postLabel={noLabels ? undefined : t('model.outputProbabilities')}
                        onClick={
                            noControls
                                ? undefined
                                : (element) => {
                                      setAnchor(element);
                                      setSelectedLayer(-1);
                                  }
                        }
                        onHover={
                            noControls
                                ? undefined
                                : (element) => {
                                      if (mover.current) return;
                                      setAnchor(element);
                                      setSelectedLayer(-1);
                                  }
                        }
                        onLeave={
                            noControls
                                ? undefined
                                : () => {
                                      setAnchor(null);
                                  }
                        }
                    />
                </g>
            </svg>
        </div>
    );
}
