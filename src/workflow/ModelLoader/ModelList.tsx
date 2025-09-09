import { List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import style from './style.module.css';
import { TeachableLLM, waitForModel } from '@genai-fi/nanogpt';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import * as tf from '@tensorflow/tfjs';
import { useState } from 'react';

interface GPTConfig {
    vocabSize: number;
    blockSize: number;
    nLayer: number;
    nHead: number;
    nEmbed: number;
    dropout: number;
    biasInLinear: boolean;
    biasInLayerNorm: boolean;
    mlpFactor: number;
    useRope: boolean;
}

export interface ManifestItem {
    name: string;
    description?: string;
    url?: string;
    config?: Partial<GPTConfig>;
    parameters: number;
    trained: boolean;
}

interface Props {
    manifest: ManifestItem[];
    model: TeachableLLM | undefined;
    onModel: (model: TeachableLLM) => void;
}

export default function ModelList({ manifest, model, onModel }: Props) {
    const [selectedModel, setSelectedModel] = useState<number>(-1);

    return (
        <List style={{ maxHeight: '250px', overflowY: 'auto', width: '100%' }}>
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
    );
}
