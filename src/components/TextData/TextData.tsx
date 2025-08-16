import { useEffect, useRef, useState } from 'react';
import style from './style.module.css';
import prettyNumber from '../../utilities/prettyNumber';
import { loadTextData, TeachableLLM } from '@genai-fi/nanogpt';
import BoxTitle from '../BoxTitle/BoxTitle';
import { IconButton, List, ListItem, ListItemAvatar, ListItemText } from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import useModelStatus from '../../utilities/useModelStatus';
import DeleteIcon from '@mui/icons-material/Delete';
import BoxMenu from '../BoxTitle/BoxMenu';

interface DataEntry {
    name: string;
    content: string[];
    size: number;
}

interface Props {
    model?: TeachableLLM;
    dataset?: string[];
    onDatasetChange: (dataset: string[]) => void;
}

export default function TextData({ model, onDatasetChange }: Props) {
    const [done, setDone] = useState(false);
    const [busy, setBusy] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const status = useModelStatus(model);
    const [data, setData] = useState<DataEntry[]>([]);

    useEffect(() => {
        const newDataset = data.map((entry) => entry.content).flat();
        onDatasetChange(newDataset);
    }, [data, onDatasetChange]);

    return (
        <div className={style.container}>
            <BoxTitle
                title="Data"
                done={done}
                busy={busy}
            />
            <BoxMenu>
                <IconButton
                    disabled={(status !== 'ready' && status !== 'awaitingTokens') || !model}
                    color="secondary"
                    onClick={() => fileRef.current?.click()}
                >
                    <FolderOpenIcon color="inherit" />
                </IconButton>
            </BoxMenu>
            <List style={{ width: '100%' }}>
                {data.map((entry, index) => (
                    <ListItem
                        key={index}
                        className={style.item}
                        secondaryAction={
                            <IconButton
                                edge="end"
                                aria-label="delete"
                                onClick={() => {
                                    setData((prev) => prev.filter((_, i) => i !== index));
                                }}
                            >
                                <DeleteIcon />
                            </IconButton>
                        }
                    >
                        <ListItemAvatar>
                            <div className={style.size}>{prettyNumber(entry.size)}</div>
                        </ListItemAvatar>
                        <ListItemText
                            primary={entry.name}
                            secondary={entry.content[0].slice(0, 30) + (entry.content[0].length > 30 ? '...' : '')}
                        />
                    </ListItem>
                ))}
            </List>
            <div className={style.buttonBox}>
                <input
                    type="file"
                    accept=".txt,.csv"
                    ref={fileRef}
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                        if (e.target.files && e.target.files.length > 0) {
                            const file = e.target.files[0];
                            console.log('File', file.name, file.type);
                            setBusy(true);
                            const text = await loadTextData(file);

                            if (model) {
                                const tokeniser = model.tokeniser;
                                if (tokeniser && !tokeniser.trained) {
                                    await tokeniser.train(text);
                                }
                            }
                            setData((prev) => [
                                ...prev,
                                {
                                    name: file.name,
                                    content: text,
                                    size: text.reduce((acc, curr) => acc + curr.length, 0),
                                },
                            ]);
                            setDone(true);
                            setBusy(false);
                        }
                    }}
                />
            </div>
        </div>
    );
}
