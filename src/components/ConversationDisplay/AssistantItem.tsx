import style from './style.module.css';
import { useEffect, useRef } from 'react';
import { ExtendedConversation } from './extended';

interface Props {
    item: ExtendedConversation;
    active?: boolean;
    busy?: boolean;
}

export default function AssistantItem({ item, active, busy }: Props) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (active && ref.current) {
            ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
        }
    }, [active]);

    return (
        <div
            ref={ref}
            className={style.assistantItem}
        >
            {item.content}
            {active && (
                <div
                    className={`${style.cursor} ${busy ? style.active : ''}`}
                    data-testid="cursor"
                ></div>
            )}
        </div>
    );
}
