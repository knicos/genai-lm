import { CSSProperties, PropsWithChildren, useEffect, useRef, useState } from 'react';
import boxstyle from './style.module.css';

interface Props extends PropsWithChildren {
    style?: CSSProperties;
    active?: boolean;
    disabled?: boolean;
    className?: string;
    fullWidth?: boolean;
    disableHiding?: boolean;
}

const isTest = globalThis?.process?.env?.NODE_ENV === 'test';

export default function BoxStandalone({
    style,
    active = true,
    disabled = false,
    className,
    children,
    fullWidth = false,
    disableHiding = false,
}: Props) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (ref.current) {
            const io = new IntersectionObserver(([entry]) => {
                setVisible(entry.isIntersecting);
            });
            io.observe(ref.current);
            return () => {
                io.disconnect();
            };
        }
    }, []);

    return (
        <div
            ref={ref}
            className={`${boxstyle.box} ${fullWidth ? boxstyle.fullWidth : ''} ${className || ''}`}
            data-active={active ? 'true' : 'false'}
            style={style}
        >
            {(visible || disableHiding || isTest) && children}
            {disabled && <div className={boxstyle.disabled} />}
        </div>
    );
}
