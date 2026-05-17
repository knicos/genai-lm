import { PropsWithChildren, useEffect, useRef } from 'react';
import style from './style.module.css';
import { useWorkflowContext } from '@genai-fi/base';

interface Props extends PropsWithChildren {
    widget: string;
}

export default function FullSizeGroup({ widget, children }: Props) {
    const ref = useRef<HTMLElement>(null);
    const workflowContext = useWorkflowContext();

    useEffect(() => {
        if (ref.current) {
            return workflowContext.registerElement(widget, ref.current);
        }
    }, [widget, workflowContext]);

    return (
        <section
            className={style.chatGroup}
            ref={ref}
        >
            {children}
        </section>
    );
}
