import { IconButton } from '@mui/material';
import style from './style.module.css';
import CloseIcon from '@mui/icons-material/Close';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoOutlineIcon from '@mui/icons-material/InfoOutline';
import { Button } from '@genai-fi/base';
import { useTranslation } from 'react-i18next';

export interface Notice {
    notice: string;
    level: 'info' | 'warning' | 'error';
}

interface Props {
    notice: Notice;
    onClose?: () => void;
}

export default function BoxNotice({ notice, onClose }: Props) {
    const { t } = useTranslation();
    return (
        <div className={style.boxNotice}>
            <IconButton
                className={style.closeButton}
                onClick={onClose}
                color="inherit"
                size="large"
            >
                <CloseIcon fontSize="large" />
            </IconButton>
            {notice.level === 'warning' && (
                <WarningAmberIcon
                    color="inherit"
                    fontSize="large"
                />
            )}
            {notice.level === 'error' && (
                <ErrorOutlineIcon
                    color="inherit"
                    fontSize="large"
                />
            )}
            {notice.level === 'info' && (
                <InfoOutlineIcon
                    color="inherit"
                    fontSize="large"
                />
            )}
            {notice.notice}
            <Button
                onClick={onClose}
                color="inherit"
                variant="contained"
                style={{ color: 'black' }}
            >
                {t('app.ok')}
            </Button>
        </div>
    );
}
