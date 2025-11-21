import { Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtom } from 'jotai';
import { Button } from '@genai-fi/base';
import GeneralSettings from './General';
import { uiShowSettings } from '../../state/uiState';

export default function SettingsDialog() {
    const { t } = useTranslation();
    const [showDialog, setShowDialog] = useAtom(uiShowSettings);

    const doClose = useCallback(() => setShowDialog(false), [setShowDialog]);

    return (
        <Dialog
            open={showDialog}
            onClose={doClose}
            scroll="paper"
            maxWidth="sm"
        >
            <DialogTitle>{t('app.settings.title')}</DialogTitle>
            <DialogContent sx={{ display: 'flex', padding: 0, maxHeight: '600px' }}>
                <GeneralSettings />
            </DialogContent>
            <DialogActions>
                <Button
                    variant="outlined"
                    onClick={doClose}
                >
                    {t('app.close')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
