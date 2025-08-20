import { Dialog, DialogActions, DialogContent, DialogTitle, Tab, Tabs } from '@mui/material';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtom } from 'jotai';
import { Button } from '@genai-fi/base';
import GeneralSettings from './General';
import GeneratorSettings from './Generator';
import { uiShowSettings } from '../../state/uiState';

export default function SettingsDialog() {
    const { t } = useTranslation();
    const [showDialog, setShowDialog] = useAtom(uiShowSettings);
    const [tabNumber, setTabNumber] = useState(0);

    const doClose = useCallback(() => setShowDialog(false), [setShowDialog]);

    return (
        <Dialog
            open={showDialog}
            onClose={doClose}
            scroll="paper"
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>{t('app.settings.title')}</DialogTitle>
            <DialogContent sx={{ display: 'flex', padding: 0, maxHeight: '600px' }}>
                <Tabs
                    value={tabNumber}
                    onChange={(_, value) => setTabNumber(value)}
                    variant="scrollable"
                    scrollButtons="auto"
                    orientation="vertical"
                    sx={{ borderRight: '1px solid #008297' }}
                >
                    <Tab label={t('app.settings.general')} />
                    <Tab label={t('app.settings.generator')} />
                </Tabs>
                {tabNumber === 0 && <GeneralSettings />}
                {tabNumber === 1 && <GeneratorSettings />}
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
