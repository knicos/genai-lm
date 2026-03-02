import { GPTConfig } from '@genai-fi/nanogpt';
import { useEffect, useMemo, useRef, useState } from 'react';
import { calculateViewBox, DEFAULT_EXTENTS } from './camera';
import VocabBox from './VocabBox';
import style from './style.module.css';
import TransformerBoxes, { BAR_BUTTON_SIZE } from './TransformerBoxes';
import { useAtom } from 'jotai';
import { modelConfigAtom } from '../../state/model';

const CAMERA_DURATION = 0.3;
const BLOCK_HEIGHT = 100;
const BLOCK_GAP = 40;

interface Props {
    architecture?: GPTConfig;
    zoom?: number;
}

export default function Architecture({ architecture, zoom }: Props) {
    const [internalArchitecture, setInternalArchitecture] = useAtom(modelConfigAtom);
    const svgRef = useRef<SVGSVGElement>(null);
    const parentRef = useRef<HTMLDivElement>(null);
    const extents = useRef<[number, number, number, number]>([0, 0, 0, 0]);
    const [scaling, setScaling] = useState(1);

    const actualZoom = useMemo(() => {
        return {
            zoom: zoom ?? 6,
            offsetX: 0.5,
            offsetY: 0.5,
            cx: 0,
            cy: 0,
            duration: CAMERA_DURATION,
        };
    }, [zoom]);

    useEffect(() => {
        if (architecture) setInternalArchitecture(architecture);
    }, [architecture, setInternalArchitecture]);

    // Animate camera motion
    useEffect(() => {
        // Ensure aspect ratio is correct
        if (svgRef.current) {
            const width = svgRef.current.clientWidth;
            const height = svgRef.current.clientHeight;
            const ratio = height / width;
            const h = (DEFAULT_EXTENTS.maxX - DEFAULT_EXTENTS.minX) * ratio;
            DEFAULT_EXTENTS.maxY = h / 2;
            DEFAULT_EXTENTS.minY = -h / 2;

            const newExtents = calculateViewBox(DEFAULT_EXTENTS, actualZoom);
            extents.current = newExtents;
            setScaling(newExtents[2] / width);
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

            if (parentRef.current) {
                parentRef.current.scrollTop = parentRef.current.scrollHeight / 2 - parentRef.current.clientHeight / 2;
                parentRef.current.scrollLeft = parentRef.current.scrollWidth / 2 - parentRef.current.clientWidth / 2;
            }
        }
    }, [actualZoom]);

    const startY =
        -(
            BLOCK_HEIGHT * internalArchitecture.nLayer +
            BLOCK_GAP * (internalArchitecture.nLayer - 1) +
            2 * BLOCK_HEIGHT +
            2 * BLOCK_GAP
        ) / 2;

    return (
        <div
            className={style.container}
            ref={parentRef}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="-500 500 1000 1000"
                width="2000px"
                height="2000px"
                ref={svgRef}
                className={style.svg}
            >
                <VocabBox
                    vocabSize={internalArchitecture?.vocabSize || 0}
                    y={startY}
                    height={BLOCK_HEIGHT}
                    onVocabSizeChange={(next: number) =>
                        setInternalArchitecture((old) => ({ ...old, vocabSize: next }))
                    }
                    scaling={scaling}
                />
                <TransformerBoxes
                    layers={internalArchitecture?.nLayer ?? 0}
                    hiddenSize={internalArchitecture?.nEmbed ?? 0}
                    heads={internalArchitecture?.nHead ?? 0}
                    y={startY + BLOCK_HEIGHT + BLOCK_GAP}
                    height={BLOCK_HEIGHT}
                    gap={BLOCK_GAP}
                    scaling={scaling}
                    onChangeHiddenSize={(next: number) => setInternalArchitecture((old) => ({ ...old, nEmbed: next }))}
                    onChangeHeads={(next: number) =>
                        setInternalArchitecture((old) => ({
                            ...old,
                            nHead: next,
                            nEmbed: Math.ceil(old.nEmbed / (next * 32)) * next * 32,
                        }))
                    }
                    onChangeLayers={(next: number) => setInternalArchitecture((old) => ({ ...old, nLayer: next }))}
                />
                <VocabBox
                    vocabSize={internalArchitecture?.vocabSize || 0}
                    y={
                        startY +
                        ((internalArchitecture?.nLayer || 0) + 1) * (BLOCK_HEIGHT + BLOCK_GAP) +
                        (2 * BAR_BUTTON_SIZE + 20)
                    }
                    height={BLOCK_HEIGHT}
                    onVocabSizeChange={(next: number) =>
                        setInternalArchitecture((old) => ({ ...old, vocabSize: next }))
                    }
                    scaling={scaling}
                />
            </svg>
        </div>
    );
}
