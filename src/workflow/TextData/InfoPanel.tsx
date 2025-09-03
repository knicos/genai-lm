import { Alert } from '@mui/material';
import style from './InfoPanel.module.css';
import { Button } from '@genai-fi/base';
import { useTranslation } from 'react-i18next';

interface Props {
    show?: boolean;
    onClose?: () => void;
    severity: 'info' | 'warning' | 'error';
    message: string;
}

export default function InfoPanel({ show, onClose, severity, message }: Props) {
    const { t } = useTranslation();
    if (!show) return null;

    return show ? (
        <div className={style.container}>
            <div className={style.innerContainer}>
                <Alert
                    severity={severity}
                    className={style.alert}
                >
                    {message}
                </Alert>
                {onClose && (
                    <Button
                        onClick={onClose}
                        variant="contained"
                    >
                        {t('data.ok')}
                    </Button>
                )}
            </div>
        </div>
    ) : null;
}
