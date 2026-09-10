import { IGeneratorOutput, GeneratorConversation } from '@genai-fi/nanogpt';
import { PointerEvent, useEffect, useRef, useState } from 'react';
import type { TokenSelectState } from '../../state/uiState';
import style from './style.module.css';

interface Highlights {
    start: number;
    end: number;
    colour: string;
}

interface Props {
    item: GeneratorConversation;
    backgroundMode: 'confidence' | 'score' | 'none' | 'custom';
    selectLength: number;
    highlights?: Highlights[];
    index: number;
    activeIndex?: number;
    onSelect?: (selection: TokenSelectState | null) => void;
}

function toHex(n: number) {
    return n.toString(16).padStart(2, '0');
}

interface SelectState {
    downToken: number;
    lastTargetToken: number;
    active: boolean;
    timeoutId?: number;
}

function updateSpanSelections(container: HTMLDivElement, selection: SelectState | null) {
    if (!container) {
        return;
    }
    const spans = container.querySelectorAll('span');
    spans.forEach((span, index) => {
        if (selection) {
            if (
                index >= Math.min(selection.downToken, selection.lastTargetToken) &&
                index <= Math.max(selection.downToken, selection.lastTargetToken)
            ) {
                span.classList.add(style.selected);
            } else {
                span.classList.remove(style.selected);
            }
        } else {
            span.classList.remove(style.selected);
        }
    });
}

function findSpanIndexFromPoint(x: number, y: number, height: number): HTMLElement | null {
    for (let tries = 0; tries < 5; tries++) {
        const el = document.elementFromPoint(x, y) as HTMLElement | null;
        const span = el?.closest('span') ?? null;
        if (span) {
            return span;
        }
        y += height;
    }

    return null;
}

function clampSelection(selection: SelectState, index: number, selectLength: number) {
    if (Math.abs(selection.downToken - index) > selectLength) {
        // Adjust downToken to maintain the selection length
        if (index > selection.downToken) {
            selection.downToken = index - selectLength;
        } else {
            selection.downToken = index + selectLength;
        }
    }
}

export default function TokenRender({
    item,
    backgroundMode,
    // highlights,
    index,
    activeIndex,
    onSelect,
    selectLength,
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const lastCountRef = useRef<number>(0);
    const latestRef = useRef<IGeneratorOutput[] | undefined>(undefined);
    const rafRef = useRef<number | null>(null);
    const selectionRef = useRef<SelectState | null>(null);
    const [dragging, setDragging] = useState(false);
    const propChangeRef = useRef<unknown[]>([backgroundMode]);

    useEffect(() => {
        if (activeIndex !== undefined && activeIndex !== index) {
            selectionRef.current = null;
            if (containerRef.current) {
                updateSpanSelections(containerRef.current, selectionRef.current);
            }
        }
    }, [activeIndex, index]);

    const tokens = item._output ?? [];
    latestRef.current = tokens;
    // schedule a single rAF update (coalesces rapid updates)
    if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(() => {
            // Check if props have changed since the last render, and if so, reset the container
            const currentProps = [backgroundMode];
            const propsChanged = currentProps.some((prop, i) => prop !== propChangeRef.current[i]);
            if (propsChanged) {
                if (containerRef.current) {
                    containerRef.current.textContent = ''; // clear
                }
                lastCountRef.current = 0;
                propChangeRef.current = currentProps;
            }

            rafRef.current = null;
            const outputs = latestRef.current ?? [];
            const container = containerRef.current;
            if (!container) {
                return;
            }

            // detect reset (e.g., new message) -> rebuild from scratch
            if (outputs.length < lastCountRef.current) {
                container.textContent = ''; // clear
                lastCountRef.current = 0;
            }

            // append only new spans
            const frag = document.createDocumentFragment();
            for (let i = lastCountRef.current; i < outputs.length; i++) {
                const out = outputs[i];
                const span = document.createElement('span');
                if (backgroundMode !== 'none') {
                    const alpha = backgroundMode === 'confidence' ? (out.confidence ?? 0) : (out.score ?? 0);
                    const colorR = ((1 - alpha) * 0xf4).toFixed(0);
                    const colorG = ((1 - alpha) * 0x43).toFixed(0);
                    const colorB = ((1 - alpha) * 0x36).toFixed(0);
                    span.style.backgroundColor = `#ff8f00${toHex(Math.floor((1 - alpha) * 0.3 * 255))}`;
                    //span.style.color = alpha < 0.3 ? 'white' : 'black';
                    span.style.color = `rgba(${colorR}, ${colorG}, ${colorB}, 1)`;
                }
                span.textContent = out.text; // safe: use textContent to avoid XSS
                span.setAttribute('data-index', i.toString());
                frag.appendChild(span);
            }
            container.appendChild(frag);
            lastCountRef.current = outputs.length;
        });
    }

    return (
        <div
            className={`${style.assistantItem} ${style.tokenMode} ${dragging ? style.dragging : ''}`}
            ref={containerRef}
            tabIndex={0}
            onKeyDown={(e) => {
                let needsUpdate = false;
                if (e.key === 'Escape') {
                    selectionRef.current = null;
                    if (containerRef.current) {
                        updateSpanSelections(containerRef.current, selectionRef.current);
                    }
                    if (onSelect) {
                        onSelect(null);
                    }
                    needsUpdate = true;
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    if (selectionRef.current) {
                        if (e.shiftKey) {
                            const currentIndex = selectionRef.current.lastTargetToken;
                            const newIndex = e.key === 'ArrowLeft' ? currentIndex - 1 : currentIndex + 1;
                            if (newIndex >= 0 && newIndex < lastCountRef.current) {
                                selectionRef.current.lastTargetToken = newIndex;
                                clampSelection(selectionRef.current, newIndex, selectLength);
                                if (containerRef.current) {
                                    updateSpanSelections(containerRef.current, selectionRef.current);
                                }
                            }
                        } else {
                            const currentIndex =
                                e.key === 'ArrowLeft'
                                    ? Math.min(selectionRef.current.lastTargetToken, selectionRef.current.downToken)
                                    : Math.max(selectionRef.current.lastTargetToken, selectionRef.current.downToken);
                            const newIndex = e.key === 'ArrowLeft' ? currentIndex - 1 : currentIndex + 1;
                            if (newIndex >= 0 && newIndex < lastCountRef.current) {
                                selectionRef.current.downToken = newIndex;
                                selectionRef.current.lastTargetToken = newIndex;
                                if (containerRef.current) {
                                    updateSpanSelections(containerRef.current, selectionRef.current);
                                }
                            }
                        }
                        e.preventDefault();
                        needsUpdate = true;
                    }
                } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                    if (selectionRef.current) {
                        const currentIndex = selectionRef.current.lastTargetToken;
                        const currentSpan = containerRef.current?.querySelector(`span[data-index="${currentIndex}"]`);
                        if (currentSpan && containerRef.current) {
                            const rect = currentSpan.getBoundingClientRect();
                            const x = rect.left + rect.width / 2;
                            const y = e.key === 'ArrowUp' ? rect.top - 1 : rect.bottom + 1;
                            const span = findSpanIndexFromPoint(x, y, e.key === 'ArrowUp' ? -rect.height : rect.height);
                            if (span?.tagName === 'SPAN') {
                                const index = parseInt(span.getAttribute('data-index') ?? '-1', 10);
                                if (e.shiftKey) {
                                    selectionRef.current.lastTargetToken = index;
                                    clampSelection(selectionRef.current, index, selectLength);
                                } else {
                                    selectionRef.current.downToken = index;
                                    selectionRef.current.lastTargetToken = index;
                                }
                                if (containerRef.current) {
                                    updateSpanSelections(containerRef.current, selectionRef.current);
                                }
                                needsUpdate = true;
                            }
                        }
                        e.preventDefault();
                    }
                }

                if (needsUpdate && selectionRef.current && onSelect) {
                    if (selectionRef.current.timeoutId !== undefined) {
                        clearTimeout(selectionRef.current.timeoutId);
                    }
                    selectionRef.current.timeoutId = window.setTimeout(() => {
                        if (selectionRef.current) {
                            selectionRef.current.timeoutId = undefined;

                            onSelect({
                                startToken: Math.min(
                                    selectionRef.current.downToken,
                                    selectionRef.current.lastTargetToken
                                ),
                                endToken: Math.max(
                                    selectionRef.current.downToken,
                                    selectionRef.current.lastTargetToken
                                ),
                                conversationIndex: index,
                            });
                        }
                    }, 400);
                }
            }}
            onPointerDown={(e: PointerEvent) => {
                const target = e.target as HTMLElement;
                if (target.tagName === 'SPAN') {
                    const index = parseInt(target.getAttribute('data-index') ?? '-1', 10);
                    selectionRef.current = { downToken: index, lastTargetToken: index, active: true };
                    //e.preventDefault();
                    setDragging(true);
                } else {
                    selectionRef.current = null;
                }
                if (containerRef.current) {
                    updateSpanSelections(containerRef.current, selectionRef.current);
                }
            }}
            onPointerMove={(e: PointerEvent) => {
                const target = e.target as HTMLElement;

                let span: HTMLElement | null = null;
                if (e.pointerType === 'mouse') {
                    span = target;
                } else {
                    const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
                    span = el?.closest('span') ?? null;
                }

                let hasChanged = false;
                if (span?.tagName === 'SPAN' && selectionRef.current && selectionRef.current.active) {
                    const index = parseInt(span.getAttribute('data-index') ?? '-1', 10);
                    if (index !== selectionRef.current.lastTargetToken) {
                        hasChanged = true;
                    }
                    selectionRef.current.lastTargetToken = index;
                    clampSelection(selectionRef.current, index, selectLength);
                    e.preventDefault();
                }
                if (selectionRef.current && hasChanged && containerRef.current) {
                    updateSpanSelections(containerRef.current, selectionRef.current);
                }
            }}
            onPointerUp={() => {
                setDragging(false);
                if (selectionRef.current && onSelect) {
                    onSelect({
                        startToken: Math.min(selectionRef.current.downToken, selectionRef.current.lastTargetToken),
                        endToken: Math.max(selectionRef.current.downToken, selectionRef.current.lastTargetToken),
                        conversationIndex: index,
                    });
                } else if (onSelect) {
                    console.log('Clear selection');
                    onSelect(null);
                }
                if (containerRef.current) {
                    updateSpanSelections(containerRef.current, selectionRef.current);
                }
                if (selectionRef.current) {
                    selectionRef.current.active = false;
                }
            }}
        ></div>
    );
}
