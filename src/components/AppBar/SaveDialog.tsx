import React, { useState, useCallback } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useTranslation } from 'react-i18next';
import TextField from '@mui/material/TextField';
import style from './AppBar.module.css';
import { Button } from '@genai-fi/base';

export interface SaveProperties {
    name: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    onSave: (props: SaveProperties) => void;
}

export default function SaveDialog({ onSave, open, onClose }: Props) {
    const { t } = useTranslation();
    const [name, setName] = useState('My Model');

    const doNameChange = useCallback(
        (ev: React.ChangeEvent<HTMLInputElement>) => {
            setName(ev.target.value);
        },
        [setName]
    );

    return (
        <Dialog
            open={!!open}
            onClose={onClose}
        >
            <DialogTitle>{t('app.saveTitle')}</DialogTitle>
            <DialogContent>
                <p>{t('app.saveMessage')}</p>
                <div className={style.padded}>
                    <TextField
                        label={t('app.saveName')}
                        variant="filled"
                        fullWidth
                        value={name}
                        onChange={doNameChange}
                    />
                </div>
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    onClick={() => {
                        onSave({ name });
                    }}
                    data-testid="save-save"
                >
                    {t('app.saveSave')}
                </Button>
                <Button
                    variant="outlined"
                    onClick={onClose}
                    data-testid="save-cancel"
                >
                    {t('app.saveCancel')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
