import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@mui/material';
import { TeachableLLM } from '@genai-fi/nanogpt';
import { ExtendedConfig } from '../../state/model';
import SearchDiagContent from './SearchDiagContent';

interface Props {
    model?: TeachableLLM;
    onModel?: (updater: (old: TeachableLLM | null) => TeachableLLM) => void;
    config?: ExtendedConfig;
    onConfig?: (config: ExtendedConfig) => void;
    onClose: () => void;
    trained?: boolean;
    allowFileOpen?: boolean;
}

export default function ModelSearch({ trained, allowFileOpen, onClose, ...props }: Props) {
    const [open, setOpen] = useState(true);

    useEffect(() => {
        if (!open) {
            const timer = setTimeout(() => {
                onClose();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [open, onClose]);

    return (
        <Dialog
            open={open}
            onClose={() => setOpen(false)}
            maxWidth="lg"
            fullWidth
            sx={{ '& .MuiPaper-root': { margin: '0', borderRadius: '0' } }}
        >
            <DialogContent sx={{ padding: '0' }}>
                <SearchDiagContent
                    trained={trained}
                    allowFileOpen={allowFileOpen}
                    onClose={() => setOpen(false)}
                    {...props}
                />
            </DialogContent>
        </Dialog>
    );
}
