import { Fragment, MouseEvent, useEffect, useRef, useState } from 'react';
import style from './style.module.css';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { theme } from '../../theme';
import InfoPop from '../InfoPop/InfoPop';
import HomeIcon from '@mui/icons-material/Home';

const ITEM_WIDTH = 200;

export interface WorkflowItem {
    id: string;
    status: 'complete' | 'available' | 'blocked' | 'warning';
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
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [hoveredItem, setHoveredItem] = useState<WorkflowItem | null>(null);

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
            <Link
                to="/workspace/home"
                className={`${style.homeButton} ${flow === 'home' ? style.selected : ''}`}
            >
                <HomeIcon fontSize="inherit" />
            </Link>
            <div
                className={style.itemList}
                ref={listRef}
            >
                {items.map((item, ix) => (
                    <Fragment key={item.id}>
                        <Link
                            to={`/workspace/${item.id}`}
                            className={`${style.item} ${flow === item.id ? style.selected : ''} ${style[item.status]}`}
                            onMouseEnter={(e: MouseEvent<HTMLElement>) => {
                                setAnchorEl(e.currentTarget);
                                setHoveredItem(item);
                                e.preventDefault();
                            }}
                            onMouseLeave={() => {
                                setAnchorEl(null);
                                setHoveredItem(null);
                            }}
                            onClick={() => {
                                setAnchorEl(null);
                                setHoveredItem(null);
                            }}
                            onContextMenu={(e: MouseEvent<HTMLElement>) => {
                                setAnchorEl(e.currentTarget);
                                setHoveredItem(item);
                                e.preventDefault();
                            }}
                        >
                            {item.status === 'complete' && (
                                <TaskAltIcon htmlColor={flow === item.id ? theme.light.success : theme.dark.success} />
                            )}
                            {item.status === 'available' && (
                                <RadioButtonUncheckedIcon
                                    htmlColor={flow === item.id ? theme.light.info : theme.dark.info}
                                />
                            )}
                            {item.status === 'blocked' && (
                                <RadioButtonUncheckedIcon htmlColor={flow === item.id ? '#aaa' : '#555'} />
                            )}
                            {item.status === 'warning' && (
                                <ErrorOutlineIcon htmlColor={flow === item.id ? theme.light.error : theme.dark.error} />
                            )}
                            <span className={style.itemText}>{t(`workflow.${item.id}`)}</span>
                        </Link>
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
            <InfoPop
                open={!!anchorEl}
                anchorEl={anchorEl}
                offsetY={20}
                delay={500}
            >
                {hoveredItem && <div>{t(`app.workflow.${hoveredItem.id}_desc`)}</div>}
            </InfoPop>
        </div>
    );
}
