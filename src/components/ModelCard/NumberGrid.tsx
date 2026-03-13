import { CSSProperties, useMemo } from 'react';
import style from './style.module.css';

type Density = 'small' | 'medium' | 'large' | 'xlarge';

const PIXEL_TRANSLATE = 6;

interface ParameterGridProps {
    density?: Density;
    seed?: string;
    fillScale?: number;
    className?: string;
}

interface Cell {
    value: number;
    rotate: number;
    tx: number;
    ty: number;
    opacity: number;
    empty: boolean;
}

const DENSITY = {
    small: { cols: 9, rows: 6, fill: 0.7 },
    medium: { cols: 12, rows: 8, fill: 0.9 },
    large: { cols: 16, rows: 10, fill: 0.95 },
    xlarge: { cols: 20, rows: 12, fill: 0.99 },
} as const;

// Simple deterministic PRNG (so visuals don't flicker on re-render)
function xmur3(str: string) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
        h = (h << 13) | (h >>> 19);
    }
    return function () {
        h = Math.imul(h ^ (h >>> 16), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        return (h ^= h >>> 16) >>> 0;
    };
}

function mulberry32(a: number) {
    return function () {
        let t = (a += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export default function ParameterGrid({
    density = 'medium',
    seed = 'default',
    fillScale = 1,
    className,
}: ParameterGridProps) {
    const config = DENSITY[density];

    const digitSizeRem = useMemo(() => {
        const baseByDensity: Record<Density, number> = {
            small: 2,
            medium: 1,
            large: 0.5,
            xlarge: 0.3,
        };

        // higher fillScale usually means denser visuals, so slightly shrink text
        const adjusted = baseByDensity[density] - (fillScale - 1) * 0.18;

        return Math.max(0.42, Math.min(2, adjusted));
    }, [density, fillScale]);

    const cells = useMemo(() => {
        const seedFn = xmur3(seed);
        const rand = mulberry32(seedFn());
        const total = config.cols * config.rows;
        const fill = Math.max(0.2, Math.min(1, config.fill * fillScale));

        const generated: Cell[] = Array.from({ length: total }, () => {
            const empty = rand() > fill;
            return {
                value: Math.floor(rand() * 10),
                rotate: -16 + rand() * 32, // -16deg..16deg
                tx: -PIXEL_TRANSLATE / 2 + rand() * PIXEL_TRANSLATE, // px
                ty: -PIXEL_TRANSLATE / 2 + rand() * PIXEL_TRANSLATE, // px
                opacity: 0.45 + rand() * 0.5,
                empty,
            };
        });

        return generated;
    }, [config.cols, config.rows, config.fill, fillScale, seed]);

    return (
        <div
            className={`${style.grid} ${className ?? ''}`}
            style={
                {
                    ['--cols' as string]: config.cols,
                    ['--rows' as string]: config.rows,
                    ['--digit-size' as string]: `${digitSizeRem}rem`,
                } as CSSProperties
            }
            aria-hidden
        >
            {cells.map((c, i) =>
                c.empty ? (
                    <span
                        key={i}
                        className={`${style.cell} ${style.empty}`}
                    />
                ) : (
                    <span
                        key={i}
                        className={style.cell}
                        style={{
                            opacity: c.opacity,
                            transform: `translate(${c.tx}px, ${c.ty}px) rotate(${c.rotate}deg)`,
                        }}
                    >
                        {c.value}
                    </span>
                )
            )}
        </div>
    );
}
