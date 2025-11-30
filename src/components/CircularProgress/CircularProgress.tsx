import style from './style.module.css';
import { theme } from '../../theme';
import { PropsWithChildren } from 'react';

interface Props extends PropsWithChildren {
    radius: number;
    color?: string;
    step: number;
    totalSteps: number;
}

export default function CircularProgress({ radius, children, step, totalSteps }: Props) {
    const stroke = 8;
    const normalizedRadius = radius - stroke / 2;

    return (
        <div className={style.clock}>
            <svg
                height={radius * 2}
                width={radius * 2}
            >
                <circle
                    fill="rgba(0, 130, 151, 0.06)"
                    strokeWidth={0}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
                {Array.from({ length: totalSteps }).map((_, i) => {
                    const radius = normalizedRadius + stroke / 2;
                    const cx = radius;
                    const cy = radius;
                    const thickness = 8;
                    const gap = 0.12; // radians gap between segments
                    const angle = (2 * Math.PI) / totalSteps;
                    const startAngle = i * angle + gap / 2 + Math.PI / 2;
                    const endAngle = (i + 1) * angle - gap / 2 + Math.PI / 2;

                    const x1 = cx + radius * Math.cos(startAngle);
                    const y1 = cy + radius * Math.sin(startAngle);
                    const x2 = cx + radius * Math.cos(endAngle);
                    const y2 = cy + radius * Math.sin(endAngle);

                    const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

                    const pathData = [
                        `M ${cx + (radius - thickness) * Math.cos(startAngle)} ${
                            cy + (radius - thickness) * Math.sin(startAngle)
                        }`,
                        `L ${x1} ${y1}`,
                        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                        `L ${cx + (radius - thickness) * Math.cos(endAngle)} ${
                            cy + (radius - thickness) * Math.sin(endAngle)
                        }`,
                        `A ${radius - thickness} ${radius - thickness} 0 ${largeArcFlag} 0 ${
                            cx + (radius - thickness) * Math.cos(startAngle)
                        } ${cy + (radius - thickness) * Math.sin(startAngle)}`,
                        'Z',
                    ].join(' ');

                    return (
                        <path
                            key={i}
                            d={pathData}
                            fill={
                                i < step
                                    ? step !== totalSteps
                                        ? '#5165c9'
                                        : theme.light.success
                                    : 'rgba(0, 130, 151, 0.1)'
                            }
                        />
                    );
                })}
            </svg>
            <div className={style.centerText}>{children}</div>
        </div>
    );
}
