import { CSSProperties, PropsWithChildren, useEffect, useRef, useState } from 'react';
import boxstyle from './style.module.css';
import { useWorkflowContext } from '@genai-fi/base';

interface Props extends PropsWithChildren {
    style?: CSSProperties;
    widget?: string;
    active?: boolean;
    disabled?: boolean;
    className?: string;
    fullWidth?: boolean;
    disableHiding?: boolean;
    useParent?: boolean;
}

const isTest = globalThis?.process?.env?.NODE_ENV === 'test';

export default function Box({
    style,
    widget,
    active = true,
    disabled = false,
    className,
    children,
    fullWidth = false,
    disableHiding = false,
    useParent = false,
}: Props) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    const workflowContext = useWorkflowContext();

    useEffect(() => {
        if (ref.current) {
            const element = useParent ? (ref.current.parentElement ?? ref.current) : ref.current;
            const remove = widget ? workflowContext.registerElement(widget, element) : undefined;
            const io = new IntersectionObserver(
                ([entry]) => {
                    setVisible(entry.isIntersecting);
                },
                { rootMargin: '50px' }
            );
            io.observe(element);
            return () => {
                io.disconnect();
                remove?.();
            };
        }
    }, [widget, workflowContext, useParent]);

    return (
        <div
            ref={ref}
            className={`${boxstyle.box} ${fullWidth ? boxstyle.fullWidth : ''} ${className || ''}`}
            data-widget={widget}
            data-active={active ? 'true' : 'false'}
            style={style}
        >
            {(visible || disableHiding || isTest) && children}
            {disabled && <div className={boxstyle.disabled} />}
        </div>
    );
}
