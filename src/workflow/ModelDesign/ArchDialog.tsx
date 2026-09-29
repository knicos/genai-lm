import { Dialog, DialogActions, DialogContent, IconButton } from '@mui/material';
import { Button, Help } from '@genai-fi/base';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import Architecture, { ArchitectureRef } from '../../components/Architecture/Architecture';
import { useRef } from 'react';
import style from './style.module.css';
import { useAtom } from 'jotai';
import { modelConfigAtom } from '../../state/model';

interface Props {
    open: boolean;
    onClose: () => void;
}

export default function ArchitectureDialog({ open, onClose }: Props) {
    const { t } = useTranslation();
    const archRef = useRef<ArchitectureRef>(null);
    const [architecture, setArchitecture] = useAtom(modelConfigAtom);
    const [internalArchitecture, setInternalArchitecture] = useState(architecture);

    useEffect(() => {
        setInternalArchitecture(architecture);
    }, [architecture]);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
        >
            <DialogContent style={{ position: 'relative' }}>
                <Help
                    message={t('model.visualHelp')}
                    style={{ width: '100%', height: '100%', overflow: 'hidden' }}
                    inside
                >
                    <Architecture
                        ref={archRef}
                        architecture={internalArchitecture}
                        onChange={setInternalArchitecture}
                    />
                </Help>
                <div className={style.zoomControls}>
                    <IconButton onClick={() => archRef.current?.zoomIn()}>
                        <ZoomInIcon />
                    </IconButton>
                    <IconButton onClick={() => archRef.current?.zoomOut()}>
                        <ZoomOutIcon />
                    </IconButton>
                </div>
            </DialogContent>
            <DialogActions>
                <Button
                    variant="outlined"
                    onClick={onClose}
                >
                    {t('model.cancel')}
                </Button>
                <Button
                    variant="contained"
                    onClick={() => {
                        setArchitecture(internalArchitecture);
                        onClose();
                    }}
                >
                    {t('model.save')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
