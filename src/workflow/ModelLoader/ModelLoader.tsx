import { useEffect, useState } from 'react';
import style from './style.module.css';
import { TeachableLLM, waitForModel } from '@genai-fi/nanogpt';
import * as tf from '@tensorflow/tfjs';
import { List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import manifest from './manifest.json';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import BoxTitle from '../../components/BoxTitle/BoxTitle';

interface Props {
    onModel: (model: TeachableLLM) => void;
    model?: TeachableLLM;
}

export default function ModelLoader({ onModel, model }: Props) {
    const [done, setDone] = useState(false);
    const [selectedModel, setSelectedModel] = useState<number>(-1);

    useEffect(() => {
        if (model) {
            //onModel(model);
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
    }, [model]);

    return (
        <div className={style.container}>
            <BoxTitle
                title="Model"
                done={done}
                busy={!done && !!model}
            ></BoxTitle>
            <List style={{ maxHeight: '250px', overflowY: 'auto' }}>
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
                                waitForModel(newModel).then(() => {
                                    onModel(newModel);
                                });
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
                                onModel(newModel);
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
        </div>
    );
}
