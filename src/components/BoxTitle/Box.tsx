import { CSSProperties, PropsWithChildren } from 'react';
import boxstyle from './style.module.css';

interface Props extends PropsWithChildren {
    style?: CSSProperties;
    widget?: string;
    active?: boolean;
    disabled?: boolean;
    className?: string;
}

export default function Box({ style, widget, active = true, disabled = false, className, children }: Props) {
    return (
        <div
            className={`${boxstyle.box} ${className || ''}`}
            data-widget={widget}
            data-active={active ? 'true' : 'false'}
            style={style}
        >
            {children}
            {disabled && <div className={boxstyle.disabled} />}
        </div>
    );
}
