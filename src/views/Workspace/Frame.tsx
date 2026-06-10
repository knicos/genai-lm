import { PropsWithChildren, Suspense, useEffect } from 'react';
import style from './style.module.css';
import { workflowStages } from '../../state/workflowSettings';
import { useAtomValue } from 'jotai';
import { uiCompactMode } from '../../state/uiState';

interface Props extends PropsWithChildren {
    name: 'model' | 'data' | 'pretrain' | 'finetune' | 'deployment';
    columns?: number;
    ignoredColumns?: number;
    observer: IntersectionObserver;
    scroll?: boolean;
}

export default function Frame({ name, children, columns, ignoredColumns, observer, scroll }: Props) {
    const stages = useAtomValue(workflowStages);
    const compact = useAtomValue(uiCompactMode);

    useEffect(() => {
        const element = document.getElementById(`frame-${name}`);
        if (element) {
            observer.observe(element);
        }
        return () => {
            if (element) {
                observer.unobserve(element);
            }
        };
    }, [observer, name]);

    useEffect(() => {
        if (scroll) {
            const element = document.getElementById(`frame-${name}`);
            if (element) {
                const t = setTimeout(() => {
                    element.scrollIntoView({
                        behavior: performance.now() > 5000 ? 'smooth' : 'instant',
                        block: 'center',
                    });
                }, 100);
                return () => clearTimeout(t);
            } else {
                console.warn('No element found for frame:', name);
            }
        }
    }, [scroll, name]);

    if (!stages.has(name)) {
        return null;
    }

    return (
        <div
            id={`frame-${name}`}
            data-widget="container"
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
