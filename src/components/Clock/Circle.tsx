import style from './style.module.css';
import { theme } from '../../theme';
import { PropsWithChildren } from 'react';

interface Props extends PropsWithChildren {
    radius: number;
    progress: number;
    color?: string;
}

export default function Circle({ radius, children, progress, color }: Props) {
    const stroke = 8;
    const normalizedRadius = radius - stroke / 2;
    const circumference = 2 * Math.PI * normalizedRadius;
    const offset = circumference * (1 - progress);

    return (
        <div className={style.clock}>
            <svg
                height={radius * 2}
                width={radius * 2}
            >
                <circle
                    stroke="rgba(0, 130, 151, 0.1)"
                    fill="rgba(0, 130, 151, 0.06)"
                    strokeWidth={stroke}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
                <circle
                    stroke={color || theme.light.success}
                    fill="none"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    style={{ transform: `rotate(90deg)`, transformOrigin: '50% 50%' }}
                    data-testid="circle-progress"
                />
            </svg>
            <div className={style.centerText}>{children}</div>
        </div>
    );
}
