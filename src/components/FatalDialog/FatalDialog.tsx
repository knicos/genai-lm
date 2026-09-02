import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import { Button } from '@genai-fi/base';
import { useTranslation } from 'react-i18next';
import { uiFatalError } from '../../state/uiState';
import { useAtomValue } from 'jotai';

export default function FatalDialog() {
    const { t } = useTranslation();
    const showFatal = useAtomValue(uiFatalError);

    return (
        <Dialog
            open={showFatal}
            onClose={() => {}}
            maxWidth="xs"
            sx={{
                '& .MuiDialogTitle-root': {
                    borderBottom: '2px solid var(--error)',
                    background: 'rgb(255, 234, 229)',
                },
            }}
        >
            <DialogTitle>{t('app.error.fatalTitle')}</DialogTitle>
            <DialogContent sx={{ padding: '2rem', marginTop: '1rem' }}>
                <DialogContentText>{t('app.error.fatalMessage')}</DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={() => {
                        window.location.reload();
                    }}
                    color="error"
                    autoFocus
                    variant="contained"
                >
                    {t('app.error.reload')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
