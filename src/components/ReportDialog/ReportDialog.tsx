import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Select,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Alert,
} from '@mui/material';
import { useRef, useState } from 'react';
import { Button } from '@genai-fi/base';
import { useTranslation } from 'react-i18next';

interface Props {
    open: boolean;
    onClose: () => void;
}

export default function ReportDialog({ open, onClose }: Props) {
    const { t } = useTranslation();
    const textRef = useRef<HTMLInputElement>(null);
    const selectRef = useRef<HTMLSelectElement>(null);
    const [hadError, setHadError] = useState(false);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
        >
            <DialogTitle>{t('app.report.title')}</DialogTitle>
            <DialogContent
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    paddingTop: '1rem !important',
                    width: '300px',
                }}
            >
                {hadError && <Alert severity="error">{t('app.report.error')}</Alert>}
                <FormControl fullWidth>
                    <InputLabel htmlFor="report-reason-label">{t('app.report.reason')}</InputLabel>
                    <Select
                        inputRef={selectRef}
                        labelId="report-reason-label"
                        defaultValue="bug"
                        label={t('app.report.reason')}
                    >
                        <MenuItem value="bug">{t('app.report.bug')}</MenuItem>
                        <MenuItem value="feedback">{t('app.report.feedback')}</MenuItem>
                        <MenuItem value="other">{t('app.report.other')}</MenuItem>
                    </Select>
                </FormControl>
                <TextField
                    inputRef={textRef}
                    label={t('app.report.message')}
                    fullWidth
                    multiline
                    rows={4}
                />
            </DialogContent>
            <DialogActions>
                <Button
                    variant="outlined"
                    onClick={onClose}
                >
                    {t('app.cancel')}
                </Button>
                <Button
                    variant="contained"
                    onClick={() => {
                        const reportText = textRef.current?.value;
                        const reportReason = selectRef.current?.value;
                        if (reportText && reportReason) {
                            const severity = reportReason === 'bug' ? 'error' : 'info';
                            fetch(`${import.meta.env.VITE_APP_API}/report`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ message: reportText, application: 'llm', severity }),
                            })
                                .catch((error) => {
                                    console.error('Failed to send report:', error);
                                    setHadError(true);
                                })
                                .then((response) => {
                                    if (response && response.ok) {
                                        setHadError(false);
                                        onClose();
                                    } else {
                                        setHadError(true);
                                    }
                                });
                        }
                    }}
                >
                    {t('app.report.send')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
