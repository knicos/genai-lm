import React from 'react';

interface DiceIconProps {
    value: number; // 1 to 6
    size?: number;
    className?: string;
    title?: string;
}

const pipLayouts: Record<number, [number, number][]> = {
    1: [[12, 12]],
    2: [
        [8, 8],
        [16, 16],
    ],
    3: [
        [8, 8],
        [12, 12],
        [16, 16],
    ],
    4: [
        [8, 8],
        [16, 8],
        [8, 16],
        [16, 16],
    ],
    5: [
        [8, 8],
        [16, 8],
        [12, 12],
        [8, 16],
        [16, 16],
    ],
    6: [
        [8, 8],
        [16, 8],
        [8, 12],
        [16, 12],
        [8, 16],
        [16, 16],
    ],
};

export default function DiceIcon({ value, size = 24, className, title = `Dice ${value}` }: DiceIconProps) {
    const pips = pipLayouts[value];
    const maskId = React.useId();

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            className={className}
            role="img"
            aria-label={title}
        >
            <mask
                id={maskId}
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width="24"
                height="24"
            >
                <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="3"
                    ry="3"
                    fill="white"
                />
                {pips.map(([cx, cy], i) => (
                    <circle
                        key={i}
                        cx={cx}
                        cy={cy}
                        r="1.6"
                        fill="black"
                    />
                ))}
            </mask>

            <rect
                x="3"
                y="3"
                width="18"
                height="18"
                rx="3"
                ry="3"
                fill="white"
                mask={`url(#${maskId})`}
            />
        </svg>
    );
}
