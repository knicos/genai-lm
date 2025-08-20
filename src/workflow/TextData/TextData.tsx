import { useEffect, useRef, useState } from 'react';
import style from './style.module.css';
import prettyNumber from '../../utilities/prettyNumber';
import { loadTextData, TeachableLLM } from '@genai-fi/nanogpt';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import { Alert, IconButton, List, ListItem, ListItemAvatar, ListItemText, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import useModelStatus from '../../utilities/useModelStatus';
import DeleteIcon from '@mui/icons-material/Delete';
import BoxMenu from '../../components/BoxTitle/BoxMenu';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();
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
                title={t('data.title')}
                done={done}
                busy={busy}
            />
            <BoxMenu>
                <Tooltip
                    title={t('data.addTooltip')}
                    arrow
                >
                    <IconButton
                        disabled={(status !== 'ready' && status !== 'awaitingTokens') || !model}
                        color="secondary"
                        onClick={() => fileRef.current?.click()}
                    >
                        <AddIcon color="inherit" />
                    </IconButton>
                </Tooltip>
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
            {data.length === 0 && model && (
                <Alert
                    severity="info"
                    className={style.alert}
                    style={{ margin: '1rem', maxWidth: '200px' }}
                >
                    {t('data.dataHint')}
                </Alert>
            )}
            {data.length === 0 && !model && (
                <Alert
                    severity="warning"
                    className={style.alert}
                    style={{ margin: '1rem', maxWidth: '200px' }}
                >
                    {t('data.modelHint')}
                </Alert>
            )}
            <div className={style.buttonBox}>
                <input
                    type="file"
                    accept=".txt,.csv"
                    ref={fileRef}
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                        if (e.target.files && e.target.files.length > 0) {
                            const file = e.target.files[0];
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
