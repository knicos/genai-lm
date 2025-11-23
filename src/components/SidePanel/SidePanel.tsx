import { KeyboardEvent, PropsWithChildren, useEffect, useRef, useState } from 'react';
import style from './style.module.css';
import CloseIcon from '@mui/icons-material/Close';
import { IconButton } from '@mui/material';

const MIN_WIDTH = 30;
const DEFAULT_WIDTH = Math.max(300, Math.floor(window.innerWidth * 0.25));

const WIDTH_STORAGE_KEY = 'sidePanelWidth';

interface Props extends PropsWithChildren {
    open?: boolean;
    onClose?: () => void;
    onOpen?: () => void;
    position?: 'left' | 'right';
}

export default function SidePanel({ children, open, onClose, onOpen, position = 'right' }: Props) {
    const [width, setWidth] = useState(open ? DEFAULT_WIDTH : 0);
    const barRef = useRef<HTMLDivElement>(null);
    const [isResizing, setIsResizing] = useState(false);
    const [isOpening, setIsOpening] = useState(false);
    const [isClosed, setIsClosed] = useState(!open);
    const lastWidthRef = useRef<number>(
        window.sessionStorage.getItem(WIDTH_STORAGE_KEY)
            ? Number(window.sessionStorage.getItem(WIDTH_STORAGE_KEY))
            : DEFAULT_WIDTH
    );

    const MAX_WIDTH = Math.floor(window.innerWidth / 2);

    useEffect(() => {
        if (!open) {
            setWidth(0);
            const timer = setTimeout(() => {
                setIsClosed(true);
            }, 300); // Match the CSS transition duration

            return () => clearTimeout(timer);
        } else {
            setIsOpening(true);
            setIsClosed(false);
        }
    }, [open]);

    // Remove width animation after opening
    // Needed to prevent width animation on resize
    useEffect(() => {
        if (isOpening) {
            setWidth(lastWidthRef.current || DEFAULT_WIDTH);
            const timer = setTimeout(() => {
                setIsOpening(false);
            }, 300); // Match the CSS transition duration

            return () => clearTimeout(timer);
        }
    }, [isOpening]);

    useEffect(() => {
        if (isResizing) {
            function handleMouseMove(e: PointerEvent) {
                if (isResizing && barRef.current) {
                    const panelRect = barRef.current.getBoundingClientRect();
                    const newWidth = position === 'right' ? panelRect.right - e.clientX : e.clientX - panelRect.left;
                    const clampedWidth = Math.max(Math.min(newWidth, MAX_WIDTH), MIN_WIDTH);

                    if (clampedWidth - newWidth > 10) {
                        setWidth(0);
                    } else {
                        lastWidthRef.current = clampedWidth;
                        setWidth(clampedWidth);
                        window.sessionStorage.setItem(WIDTH_STORAGE_KEY, clampedWidth.toString());
                    }
                    e.preventDefault();
                }
            }

            function handleMouseUp() {
                setIsResizing(false);
            }

            window.addEventListener('pointermove', handleMouseMove, { passive: false });
            window.addEventListener('pointerup', handleMouseUp);

            document.body.classList.add(style.noSelect);

            return () => {
                window.removeEventListener('pointermove', handleMouseMove);
                window.removeEventListener('pointerup', handleMouseUp);
                document.body.classList.remove(style.noSelect);
            };
        }
    }, [isResizing, position, MAX_WIDTH]);

    const isMinimised = width === 0;

    const resizer = (
        <div
            className={`${style.resizer} ${isResizing ? style.resizing : ''}`}
            onPointerDown={() => {
                setIsResizing(true);
                if (onOpen) {
                    onOpen();
                }
                //e.currentTarget.setPointerCapture(e.pointerId);
                //e.preventDefault();
            }}
        >
            <div className={style.resizerBar} />
            <div
                className={`${style.resizerHandle} ${isMinimised ? style.minimised : ''}`}
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize sidebar"
                tabIndex={0}
                aria-valuenow={width}
                aria-valuemin={MIN_WIDTH}
                aria-valuemax={MAX_WIDTH}
                onKeyDown={(e: KeyboardEvent) => {
                    if (e.key === 'ArrowRight') {
                        setWidth((w) => Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, w - 50)));
                    } else if (e.key === 'ArrowLeft') {
                        setWidth((w) => Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, w + 50)));
                    }
                }}
            />
        </div>
    );

    return (
        <section
            className={`${style.sidePanel} ${open ? style.open : style.closed} ${isOpening ? style.opening : ''}`}
            style={{ width: isMinimised ? 0 : width, visibility: isClosed ? 'hidden' : undefined }}
            ref={barRef}
            aria-hidden={!open}
        >
            {position === 'right' && resizer}
            <div className={style.content}>
                {onClose && (
                    <div className={style.closeButton}>
                        <IconButton
                            onClick={onClose}
                            data-testid="sidepanel-close-button"
                        >
                            <CloseIcon
                                fontSize="medium"
                                htmlColor="#444"
                            />
                        </IconButton>
                    </div>
                )}
                {children}
            </div>
            {position === 'left' && resizer}
        </section>
    );
}
