import { IconButton } from '@mui/material';
import InfoPop from '../InfoPop/InfoPop';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { CSSProperties, MouseEvent, PropsWithChildren, useState } from 'react';
import style from './style.module.css';

interface Props extends PropsWithChildren {
    message: string;
    widget?: string;
    active?: boolean;
    style?: CSSProperties;
    placement?: 'top' | 'bottom' | 'left' | 'right';
    inplace?: boolean;
}

export default function Help({ message, children, widget, style: customStyle, active, placement, inplace }: Props) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleClick = (event: MouseEvent<HTMLElement>) => {
        setAnchorEl(inplace ? event.currentTarget : event.currentTarget.parentElement);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <div
            className={`${inplace ? style.inplaceContainer : style.container} ${anchorEl && !inplace ? style.active : ''}`}
            data-widget={widget}
            data-active={active ? 'true' : 'false'}
            style={customStyle}
        >
            {!inplace && (
                <IconButton
                    onClick={handleClick}
                    onMouseLeave={handleClose}
                    className={style.helpButton}
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
