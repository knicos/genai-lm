import { IconButton } from '@mui/material';
import InfoPop from '../InfoPop/InfoPop';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { CSSProperties, MouseEvent, PropsWithChildren, useEffect, useRef, useState } from 'react';
import style from './style.module.css';
import { useWorkflowContext } from '@genai-fi/base';

interface Props extends PropsWithChildren {
    message: string;
    widget?: string;
    active?: boolean;
    style?: CSSProperties;
    placement?: 'top' | 'bottom' | 'left' | 'right';
    inplace?: boolean;
    inside?: boolean;
}

export default function HelpBox({
    message,
    children,
    widget,
    style: customStyle,
    active,
    placement,
    inplace,
    inside,
}: Props) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const workflowContext = useWorkflowContext();
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (ref.current) {
            const remove = widget ? workflowContext.registerElement(widget, ref.current) : undefined;
            return () => {
                remove?.();
            };
        }
    }, [widget, workflowContext]);

    const handleClick = (event: MouseEvent<HTMLElement>) => {
        setAnchorEl(inplace || inside ? event.currentTarget : event.currentTarget.parentElement);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <div
            className={`${inplace ? style.inplaceContainer : style.container} ${anchorEl && !inplace && !inside ? style.active : ''}`}
            data-widget={widget}
            data-active={active ? 'true' : 'false'}
            style={customStyle}
            ref={ref}
        >
            {!inplace && (
                <IconButton
                    onClick={handleClick}
                    onMouseLeave={handleClose}
                    className={`${style.helpButton} ${inside ? style.helpButtonInside : ''}`}
                    color="inherit"
                >
                    <HelpOutlineIcon fontSize="medium" />
                </IconButton>
            )}
            {children}
            {inplace && (
                <IconButton
                    onClick={handleClick}
                    onMouseLeave={handleClose}
                    className={style.helpButtonInplace}
                    color="inherit"
                >
                    <HelpOutlineIcon fontSize="medium" />
                </IconButton>
            )}
            <InfoPop
                anchorEl={anchorEl}
                open={!!anchorEl}
                placement={placement}
            >
                {message}
            </InfoPop>
        </div>
    );
}
