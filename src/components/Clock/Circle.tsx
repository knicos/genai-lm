import style from './style.module.css';
import { theme } from '../../theme';
import { PropsWithChildren } from 'react';

interface Props extends PropsWithChildren {
    radius: number;
    progress: number;
    color?: string;
    animated?: boolean;
    dark?: boolean;
    onClick?: () => void;
}

export default function Circle({ radius, children, progress, color, animated, dark, onClick }: Props) {
    const stroke = 8;
    const normalizedRadius = radius - stroke / 2;
    const circumference = 2 * Math.PI * normalizedRadius;
    const offset = circumference * (1 - progress);

    return (
        <div
            className={`${style.clock} ${onClick ? style.clickable : ''}`}
            onClick={onClick}
        >
            <svg
                height={radius * 2}
                width={radius * 2}
            >
                <circle
                    stroke={dark ? 'rgba(65, 188, 207, 0.3)' : 'rgba(0, 130, 151, 0.1)'}
                    fill={dark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 130, 151, 0.06)'}
                    strokeWidth={stroke}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
                <circle
                    stroke={color || (dark ? theme.dark.success : theme.light.success)}
                    fill="none"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    style={{
                        transform: `rotate(90deg)`,
                        transformOrigin: '50% 50%',
                        transition: animated ? 'stroke-dashoffset 0.3s ease-out' : 'none',
                    }}
                    data-testid="circle-progress"
                />
            </svg>
            <div className={style.centerText}>{children}</div>
        </div>
    );
}
