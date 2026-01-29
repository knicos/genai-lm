import { CSSProperties, PropsWithChildren } from 'react';
import boxstyle from './style.module.css';

interface Props extends PropsWithChildren {
    style?: CSSProperties;
    widget?: string;
    active?: boolean;
    disabled?: boolean;
    className?: string;
    fullWidth?: boolean;
}

export default function Box({
    style,
    widget,
    active = true,
    disabled = false,
    className,
    children,
    fullWidth = false,
}: Props) {
    return (
        <div
            className={`${boxstyle.box} ${fullWidth ? boxstyle.fullWidth : ''} ${className || ''}`}
            data-widget={widget}
            data-active={active ? 'true' : 'false'}
            style={style}
        >
            {children}
            {disabled && <div className={boxstyle.disabled} />}
        </div>
    );
}
