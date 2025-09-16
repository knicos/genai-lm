import { Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import style from './style.module.css';
import { Button } from '@genai-fi/base';
import { useTranslation } from 'react-i18next';

interface Props {
    open: boolean;
    onClose: () => void;
    text?: string;
}

export default function TextDialog({ open, onClose, text }: Props) {
    const { t } = useTranslation();
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>{t('data.textDialogTitle')}</DialogTitle>
            <DialogContent>
                <pre className={style.textDialog}>{text}</pre>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={onClose}
                    variant="outlined"
                >
                    {t('data.close')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
