import { IGeneratorOutput, GeneratorConversation } from '@genai-fi/nanogpt';
import { useEffect, useRef, useState } from 'react';
import style from './style.module.css';
import { Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface Props {
    item: GeneratorConversation;
    mode: 'confidence' | 'score';
}

function toHex(n: number) {
    return n.toString(16).padStart(2, '0');
}

export default function ConfidenceHighlights({ item, mode }: Props) {
    const { t } = useTranslation();
    const containerRef = useRef<HTMLDivElement>(null);
    const lastCountRef = useRef<number>(0);
    const latestRef = useRef<IGeneratorOutput[] | undefined>(undefined);
    const rafRef = useRef<number | null>(null);
    const mountCountRef = useRef<number>(0);
    const [selectedIndex, setSelectedIndex] = useState<number>(-1);
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }
        container.textContent = ''; // clear
        lastCountRef.current = 0;
    }, [mode]);

    const tokens = item._output ?? [];
    latestRef.current = tokens;
    // schedule a single rAF update (coalesces rapid updates)
    if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(() => {
            if (mountCountRef.current === 0) {
                return;
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
                const alpha = mode === 'confidence' ? (out.confidence ?? 0) : (out.score ?? 0);
                const colorR = ((1 - alpha) * 0xf4).toFixed(0);
                const colorG = ((1 - alpha) * 0x43).toFixed(0);
                const colorB = ((1 - alpha) * 0x36).toFixed(0);
                span.style.backgroundColor = `#ff8f00${toHex(Math.floor((1 - alpha) * 0.3 * 255))}`;
                //span.style.color = alpha < 0.3 ? 'white' : 'black';
                span.style.color = `rgba(${colorR}, ${colorG}, ${colorB}, 1)`;
                span.textContent = out.text; // safe: use textContent to avoid XSS
                span.setAttribute('data-index', i.toString());
                frag.appendChild(span);
            }
            container.appendChild(frag);
            lastCountRef.current = outputs.length;
        });
    }

    useEffect(() => {
        const count = mountCountRef;
        count.current++;
        return () => {
            count.current--;
        };
    }, []);

    const selectedConfidence =
        selectedIndex >= 0 && selectedIndex < tokens.length ? tokens[selectedIndex].confidence : null;
    const selectedScore = selectedIndex >= 0 && selectedIndex < tokens.length ? tokens[selectedIndex].score : null;

    return (
        <Tooltip
            arrow
            open={selectedConfidence !== null || selectedScore !== null}
            slotProps={{
                popper: {
                    anchorEl,
                },
            }}
            title={
                mode === 'confidence'
                    ? t('generator.confidenceValue', {
                          value: selectedConfidence !== null ? (selectedConfidence * 100).toFixed(0) : '--',
                      })
                    : t('generator.scoreValue', {
                          value: selectedScore !== null ? (selectedScore * 100).toFixed(0) : '--',
                      })
            }
        >
            <div
                className={style.assistantItem}
                ref={containerRef}
                onMouseMove={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.tagName === 'SPAN') {
                        setAnchorEl(target);
                        const index = parseInt(target.getAttribute('data-index') ?? '-1', 10);
                        setSelectedIndex(index);
                    } else {
                        setSelectedIndex(-1);
                    }
                }}
                onMouseLeave={() => {
                    setSelectedIndex(-1);
                }}
            ></div>
        </Tooltip>
    );
}
