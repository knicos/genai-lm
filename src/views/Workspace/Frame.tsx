import { PropsWithChildren, Suspense, useCallback } from 'react';
import style from './style.module.css';
import { workflowStages } from '../../state/workflowSettings';
import { useAtomValue } from 'jotai';
import { uiCompactMode } from '../../state/uiState';
import type { WorkflowStage } from '../../state/workflowSettings';

interface Props extends PropsWithChildren {
    name: WorkflowStage;
    columns?: number;
    ignoredColumns?: number;
    registerFrame: (flow: WorkflowStage, element: HTMLDivElement | null) => void;
}

export default function Frame({ name, children, columns, ignoredColumns, registerFrame }: Props) {
    const stages = useAtomValue(workflowStages);
    const compact = useAtomValue(uiCompactMode);

    const setRef = useCallback(
        (element: HTMLDivElement | null) => {
            registerFrame(name, element);
        },
        [registerFrame, name]
    );

    if (!stages.has(name)) {
        return null;
    }

    return (
        <div
            id={`frame-${name}`}
            data-widget="container"
            ref={setRef}
            data-pan
            className={`${style.frame} ${compact ? style.compact : ''}`}
            style={{
                gridTemplateColumns: `repeat(${
                    columns !== undefined
                        ? columns
                        : Array.isArray(children)
                          ? children.filter((c) => !!c).length - (ignoredColumns || 0)
                          : 1
                }, max-content)`,
            }}
        >
            <Suspense fallback={<div className={style.loading}>...</div>}>{children}</Suspense>
        </div>
    );
}
