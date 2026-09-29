import { CSSProperties, PropsWithChildren, useEffect, useRef, useState } from 'react';
import boxstyle from './style.module.css';
import { useWorkflowContext } from '@genai-fi/base';
import { useAtomValue } from 'jotai';
import { uiAuditOutput } from '../../state/uiState';

interface Props extends PropsWithChildren {
    style?: CSSProperties;
    widget?: string;
    active?: boolean;
    disabled?: boolean;
    className?: string;
    fullWidth?: boolean;
    disableHiding?: boolean;
    useParent?: boolean;
    deactivateOnAudit?: boolean;
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
    deactivateOnAudit = false,
}: Props) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    const workflowContext = useWorkflowContext();
    const auditMode = useAtomValue(uiAuditOutput);
    const sizeRef = useRef<{ width: number; height: number } | null>(null);

    useEffect(() => {
        if (ref.current) {
            const element = useParent ? (ref.current.parentElement ?? ref.current) : ref.current;
            const remove = widget ? workflowContext.registerElement(widget, element) : undefined;
            const io = new IntersectionObserver(
                ([entry]) => {
                    if (!entry.isIntersecting) {
                        sizeRef.current = {
                            width: entry.boundingClientRect.width,
                            height: entry.boundingClientRect.height,
                        };
                    }
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
            className={`${boxstyle.box} ${fullWidth ? boxstyle.fullWidth : ''} ${className || ''} box ${deactivateOnAudit && auditMode ? boxstyle.deactivated : ''}`}
            data-widget={widget}
            data-active={active ? 'true' : 'false'}
            data-deactivated={deactivateOnAudit && auditMode ? 'true' : 'false'}
            style={
                sizeRef.current && !visible
                    ? {
                          width: sizeRef.current.width,
                          height: sizeRef.current.height,
                          ...style,
                      }
                    : style
            }
        >
            {(visible || disableHiding || isTest) && children}
            {disabled && <div className={boxstyle.disabled} />}
        </div>
    );
}
