import style from './InfoPanel.module.css';
import { Button } from '@genai-fi/base';
import { useTranslation } from 'react-i18next';
import InfoOutlineIcon from '@mui/icons-material/InfoOutline';

interface Props {
    show?: boolean;
    onClose?: () => void;
    severity: 'info' | 'warning' | 'error';
    message: string;
}

export default function InfoPanel({ show, onClose, message }: Props) {
    const { t } = useTranslation();
    if (!show) return null;

    return show ? (
        <div className={style.innerContainer}>
            <InfoOutlineIcon
                fontSize="large"
                color="inherit"
            />
            {message}
            {onClose && (
                <Button
                    onClick={onClose}
                    variant="contained"
                >
                    {t('data.ok')}
                </Button>
            )}
        </div>
    ) : null;
}
