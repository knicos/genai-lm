import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import { Button } from '@genai-fi/base';
import { useTranslation } from 'react-i18next';

interface Props {
    open: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
}

export default function ConfirmDialog({ open, title, message, confirmText, onConfirm, onCancel }: Props) {
    const { t } = useTranslation();

    return (
        <Dialog
            open={open}
            onClose={onCancel}
            maxWidth="xs"
            sx={{
                '& .MuiDialogTitle-root': {
                    borderBottom: '2px solid var(--bg-colorful2)',
                    background: 'rgb(255, 244, 229)',
                },
            }}
        >
            <DialogTitle>{title}</DialogTitle>
            <DialogContent sx={{ padding: '2rem', marginTop: '1rem' }}>
                <DialogContentText>{message}</DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel}>{t('app.cancel')}</Button>
                <Button
                    onClick={onConfirm}
                    color="primary"
                    autoFocus
                    variant="contained"
                >
                    {confirmText ?? t('app.confirm')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
