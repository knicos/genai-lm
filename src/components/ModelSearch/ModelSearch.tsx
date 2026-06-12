import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@mui/material';
import { TeachableLLM } from '@genai-fi/nanogpt';
import { RowSet } from '../CardRow/CardRow';
import { ModelCardItem } from '../ModelCard/type';
import { ExtendedConfig } from '../../state/model';
import SearchContent from './SearchContent';

interface Props {
    model?: TeachableLLM;
    onModel?: (updater: (old: TeachableLLM | null) => TeachableLLM) => void;
    config?: ExtendedConfig;
    onConfig?: (config: ExtendedConfig) => void;
    onClose: () => void;
    dataRows: RowSet<ModelCardItem>[];
    langs: { code: string; name: string }[];
    setLang: (lang: string) => void;
    lang: string;
    limitToModelArchitecture?: boolean;
}

export default function ModelSearch({ onClose, ...props }: Props) {
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
                <SearchContent
                    {...props}
                    onClose={() => setOpen(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
