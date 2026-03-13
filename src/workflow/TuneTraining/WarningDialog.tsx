import { Button } from '@genai-fi/base';
import { Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export default function WarningDialog() {
    const [openWarning, setOpenWarning] = useState(() => {
        const dismissed = window.sessionStorage.getItem('finetuneWarningDismissed');
        return dismissed !== 'true';
    });
    const { t } = useTranslation();

    const doClose = () => {
        setOpenWarning(false);
        window.sessionStorage.setItem('finetuneWarningDismissed', 'true');
    };

    return (
        <Dialog
            open={openWarning}
            onClose={doClose}
        >
            <DialogTitle>{t('finetune.warningTitle')}</DialogTitle>
            <DialogContent>
                <div style={{ display: 'flex', alignItems: 'center', maxWidth: '350px', gap: '2rem' }}>
                    <WarningAmberIcon
                        color="warning"
                        fontSize="large"
                    />
                    {t('finetune.warningContent')}
                </div>
            </DialogContent>
            <DialogActions>
                <Button
                    variant="outlined"
                    color="primary"
                    onClick={doClose}
                >
                    {t('finetune.ok')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
