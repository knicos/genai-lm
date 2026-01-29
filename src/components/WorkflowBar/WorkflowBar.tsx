import { Fragment, useEffect, useRef, useState } from 'react';
import style from './style.module.css';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const ITEM_WIDTH = 200;

export interface WorkflowItem {
    id: string;
}

export interface Props {
    items: WorkflowItem[];
}

export default function WorkflowBar({ items }: Props) {
    const { t } = useTranslation();
    const [width, setWidth] = useState(0);
    const [itemWidth, setItemWidth] = useState(ITEM_WIDTH);
    const listRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [offset, setOffset] = useState(0);
    const { flow } = useParams();

    useEffect(() => {
        const h = () => {
            if (containerRef.current) {
                const w = containerRef.current.getBoundingClientRect().width;
                setWidth(w);
            }
            if (listRef.current) {
                const w = listRef.current.scrollWidth;
                setItemWidth(w / items.length);
            }
        };
        h();
        window.addEventListener('resize', h);
        return () => window.removeEventListener('resize', h);
    }, [items.length]);

    const numVisible = Math.floor((width + 20) / (itemWidth + 20));
    const hasLeftArrow = numVisible > 1 && offset > 0;
    const hasRightArrow = numVisible > 1 && offset + numVisible < items.length;

    const handleOffsetChange = (newOffset: number) => {
        setOffset((o) => Math.max(0, Math.min(items.length - numVisible, o + newOffset)));
    };

    useEffect(() => {
        if (listRef.current) {
            const child = listRef.current.children[offset] as HTMLElement | undefined;
            if (child) {
                child.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
            }
        }
    }, [offset]);

    return (
        <div
            className={style.container}
            ref={containerRef}
        >
            <div
                className={style.itemList}
                ref={listRef}
            >
                {items.map((item, ix) => (
                    <Fragment key={item.id}>
                        <div
                            key={item.id}
                            className={`${style.item} ${flow === item.id ? style.selected : ''}`}
                        >
                            <Link to={`/workspace/${item.id}`}>{t(`workflow.${item.id}`)}</Link>
                        </div>
                        {ix < items.length - 1 && <div className={style.bgBar} />}
                    </Fragment>
                ))}
            </div>
            {hasLeftArrow && (
                <button
                    type="button"
                    className={`${style.arrow} ${style.left}`}
                    onClick={() => handleOffsetChange(-1)}
                >
                    <ArrowBackIosNewIcon fontSize="inherit" />
                </button>
            )}
            {hasRightArrow && (
                <button
                    type="button"
                    className={`${style.arrow} ${style.right}`}
                    onClick={() => handleOffsetChange(1)}
                >
                    <ArrowForwardIosIcon fontSize="inherit" />
                </button>
            )}
        </div>
    );
}
