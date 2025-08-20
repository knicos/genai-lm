import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { useRef, useState } from 'react';
interface Props {
    open: boolean;
    onClose: () => void;
    onModel: (data: string | File) => void;
}

export default function LoadDialog({ open, onClose, onModel }: Props) {
    const [data, setData] = useState<string | File | undefined>(undefined);
    const fileRef = useRef<HTMLInputElement>(null);
    return (
        <Dialog
            open={open}
            onClose={onClose}
        >
            <input
                type="file"
                accept=".zip"
                ref={fileRef}
                style={{ display: 'none' }}
                onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                        const file = e.target.files[0];
                        setData(file);
                    }
                }}
            />
            <DialogTitle>Load Model</DialogTitle>
            <DialogContent>
                <Button
                    variant="contained"
                    onClick={() => fileRef.current?.click()}
                >
                    Load File
                </Button>
                <p>Or use default model:</p>
                <Button
                    variant="outlined"
                    onClick={() => {
                        setData('https://store.gen-ai.fi/llm/nano_imdb1.zip');
                    }}
                >
                    Use Default Model
                </Button>
            </DialogContent>
            <DialogActions>
                <Button
                    disabled={data === undefined}
                    onClick={() => {
                        if (data !== undefined) onModel(data);
                        onClose();
                    }}
                    color="primary"
                    variant="contained"
                >
                    Done
                </Button>
                <Button
                    onClick={onClose}
                    color="primary"
                    variant="outlined"
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}
