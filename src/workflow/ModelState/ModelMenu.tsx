import { useTranslation } from 'react-i18next';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import style from './style.module.css';
import UploadIcon from '@mui/icons-material/Upload';
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useState } from 'react';

interface Props {
    onCreate?: () => void;
    onUpload?: () => void;
    onSearch?: () => void;
    onDownload?: () => void;
    onTools?: () => void;
    disabled?: boolean;
}

export default function ModelMenu({ onSearch, onDownload, onUpload, disabled }: Props) {
    const { t } = useTranslation();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <div className={style.modelMenu}>
            <IconButton
                aria-label={t('model.aria.more')}
                id={`model-menu-button`}
                aria-controls={open ? `model-menu` : undefined}
                aria-expanded={open ? 'true' : undefined}
                aria-haspopup="true"
                onClick={handleClick}
                size="large"
                color="inherit"
            >
                <MoreVertIcon fontSize="large" />
            </IconButton>
            <Menu
                id={`model-menu`}
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
            >
                {onUpload && (
                    <MenuItem
                        disabled={disabled}
                        onClick={onUpload}
                    >
                        <ListItemIcon>
                            <UploadIcon color="inherit" />
                        </ListItemIcon>
                        <ListItemText>{t('model.upload')}</ListItemText>
                    </MenuItem>
                )}
                {onSearch && (
                    <MenuItem
                        disabled={disabled}
                        onClick={onSearch}
                    >
                        <ListItemIcon>
                            <SearchIcon color="inherit" />
                        </ListItemIcon>
                        <ListItemText>{t('model.search')}</ListItemText>
                    </MenuItem>
                )}
                {onDownload && (
                    <MenuItem
                        disabled={disabled}
                        onClick={onDownload}
                    >
                        <ListItemIcon>
                            <DownloadIcon color="inherit" />
                        </ListItemIcon>
                        <ListItemText>{t('model.download')}</ListItemText>
                    </MenuItem>
                )}
            </Menu>
        </div>
    );
}
