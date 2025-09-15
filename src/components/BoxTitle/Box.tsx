import { CSSProperties, PropsWithChildren } from 'react';
import boxstyle from './style.module.css';

interface Props extends PropsWithChildren {
    style?: CSSProperties;
    widget?: string;
    active?: boolean;
}

export default function Box({ style, widget, active = true, children }: Props) {
    return (
        <div
            className={boxstyle.box}
            data-widget={widget}
            data-active={active ? 'true' : 'false'}
            style={style}
        >
            {children}
        </div>
    );
}
