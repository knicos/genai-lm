import { WheelEvent } from 'react';

const ZOOM_SPEED = 0.002;
//const TOUCH_ZOOM_SPEED = 0.01;
const CAMERA_DURATION = 0.3;

export interface ZoomState {
    zoom: number;
    offsetX: number;
    offsetY: number;
    cx: number;
    cy: number;
    duration: number;
}

export interface Extents {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

export const DEFAULT_EXTENTS: Extents = {
    minX: -500,
    minY: -500,
    maxX: 500,
    maxY: 500,
};

export function calculateViewBox(extents: Extents, zoom: ZoomState): [number, number, number, number] {
    const pw = Math.max(500, extents.maxX - extents.minX);
    const ph = Math.max(500, extents.maxY - extents.minY);
    const w = pw * zoom.zoom;
    const h = ph * zoom.zoom;
    const x = zoom.cx - zoom.offsetX * w;
    const y = zoom.cy - zoom.offsetY * h;
    return [x, y, w, h]; //`${x} ${y} ${w} ${h}`;
}

export function wheelZoom(
    e: WheelEvent<SVGSVGElement>,
    extents: [number, number, number, number],
    oldZoom: ZoomState
): ZoomState {
    //if (onZoom) onZoom(newZoom);

    const offsetX = 0.5; // e.clientX / (svg.clientWidth || 1);
    const offsetY = 0.5; // e.clientY / (svg.clientHeight || 1);

    const newX = extents[0] + extents[2] * offsetX;
    const newY = extents[1] + extents[3] * offsetY;
    const newZoom = Math.max(0.5, oldZoom.zoom + e.deltaY * ZOOM_SPEED * oldZoom.zoom);
    return { zoom: newZoom, offsetX, offsetY, cx: newX, cy: newY, duration: CAMERA_DURATION };
}
