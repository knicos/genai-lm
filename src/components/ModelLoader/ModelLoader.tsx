import LoadDialog from './LoadDialog';
import { useEffect, useState } from 'react';
import style from './style.module.css';
import { TeachableLLM } from '@genai-fi/nanogpt';
import * as tf from '@tensorflow/tfjs';
import { IconButton, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import manifest from './manifest.json';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import BoxTitle from '../BoxTitle/BoxTitle';

interface Props {
    onModel: (model: TeachableLLM) => void;
}

export default function ModelLoader({ onModel }: Props) {
    const [open, setOpen] = useState(false);
    const [model, setModel] = useState<TeachableLLM | undefined>();
    const [done, setDone] = useState(false);
    const [selectedModel, setSelectedModel] = useState<number>(-1);

    useEffect(() => {
        if (model) {
            onModel(model);
            if (model.ready) {
                setDone(true);
            } else {
                const h = (status: string) => {
                    if (status === 'ready') setDone(true);
                };
                model.on('status', h);
                return () => {
                    model.off('status', h);
                };
            }
            setDone(true);
        }
    }, [model, onModel]);

    return (
        <div className={style.container}>
            <BoxTitle
                title="Model"
                button={
                    <IconButton
                        disabled={!!model}
                        color="secondary"
                        style={{ border: !!model ? '1px solid #eee' : '1px solid rgb(174, 37, 174)' }}
                        onClick={() => setOpen(true)}
                    >
                        <FolderOpenIcon color="inherit" />
                    </IconButton>
                }
                done={done}
                busy={!done && !!model}
            ></BoxTitle>
            <List>
                {manifest.map((m, ix) => (
                    <ListItemButton
                        selected={selectedModel === ix}
                        key={ix}
                        className={style.modelItem}
                        onClick={() => {
                            setSelectedModel(ix);
                            console.log('Selected model:', m.name);
                            if (m.url) {
                                if (model) {
                                    console.log('Disposing old model');
                                    try {
                                        model.dispose();
                                    } catch (e) {
                                        console.error('Error disposing old model:', e);
                                        return undefined;
                                    }
                                }
                                const newModel = TeachableLLM.loadModel(tf, m.url);
                                setModel(newModel);
                            } else {
                                if (model) {
                                    console.log('Disposing old model');
                                    try {
                                        model.dispose();
                                    } catch (e) {
                                        console.error('Error disposing old model:', e);
                                        return undefined;
                                    }
                                }
                                const newModel = TeachableLLM.create(tf, m.config);
                                setModel(newModel);
                            }
                        }}
                    >
                        <ListItemIcon>
                            {selectedModel === ix ? (
                                <RadioButtonCheckedIcon color="primary" />
                            ) : (
                                <RadioButtonUncheckedIcon color="disabled" />
                            )}
                        </ListItemIcon>

                        <ListItemText
                            primary={m.name}
                            secondary={m.description}
                        />
                    </ListItemButton>
                ))}
            </List>
            <LoadDialog
                open={open}
                onClose={() => setOpen(false)}
                onModel={async (data: string | File) => {
                    setModel(TeachableLLM.loadModel(tf, data));
                }}
            />
        </div>
    );
}
