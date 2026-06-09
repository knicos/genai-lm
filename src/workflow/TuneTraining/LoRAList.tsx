import { TeachableLLM } from '@genai-fi/nanogpt';
import AddIcon from '@mui/icons-material/Add';
import { useEffect, useState } from 'react';
import useModelLoaded from '../../hooks/useModelLoaded';
import { useTranslation } from 'react-i18next';
import style from './lora.module.css';
import LoRAItem from './LoRAItem';
import NewLoRA from './NewLoRA';
import { tunerSettings } from '../../state/trainer';
import { useAtomValue } from 'jotai';
import { IconButton, LinearProgress, Tooltip } from '@mui/material';
import StopCircleIcon from '@mui/icons-material/StopCircle';

interface Props {
    model: TeachableLLM | null;
    selected: string | null;
    extraActions?: React.ReactNode;
    onSelect: (fn: (prev: string | null) => string | null) => void;
    progress: number | null;
    onStop: () => void;
}

export default function LoRAList({ model, onSelect, selected, extraActions, progress, onStop }: Props) {
    const { t } = useTranslation();
    const [loras, setLoras] = useState<string[]>([]);
    const ready = useModelLoaded(model ?? undefined);
    const [addNew, setAddNew] = useState(false);
    const trainingSettings = useAtomValue(tunerSettings);

    useEffect(() => {
        if (!model || !ready) return;
        setLoras(model.model.listLoRAs());
    }, [model, ready]);

    return (
        <div className={style.container}>
            <ul>
                <li key="none">
                    <LoRAItem
                        disabled={progress !== null}
                        onClick={() => {
                            onSelect(() => null);
                            if (model) {
                                try {
                                    model.detachLoRA();
                                } catch (e) {
                                    console.error('Failed to detach LoRA:', e);
                                }
                            }
                        }}
                        selected={selected === null}
                        text={t('instruct.noLoRA')}
                        off
                    />
                </li>
                {loras.map((lora) => (
                    <li key={lora}>
                        <LoRAItem
                            disabled={progress !== null}
                            text={lora}
                            selected={selected === lora}
                            onClick={() => {
                                onSelect(() => lora);
                                if (model) {
                                    try {
                                        model.attachLoRA(lora);
                                    } catch (e) {
                                        console.error('Failed to attach LoRA:', e);
                                    }
                                }
                            }}
                            onDelete={() => {
                                if (!model) return;
                                try {
                                    model.model.deleteLoRA(lora);
                                } catch (e) {
                                    console.error('Failed to delete LoRA:', e);
                                    return;
                                }
                                setLoras(model.listLoRAs());
                                onSelect((prev) => (prev === lora ? null : prev));
                            }}
                        />
                    </li>
                ))}
                {addNew && (
                    <li>
                        <NewLoRA
                            onDone={(name) => {
                                if (!name) {
                                    setAddNew(false);
                                    return;
                                }
                                if (model && ready) {
                                    try {
                                        model.createLoRA(name, {
                                            rank: trainingSettings.loraConfig?.rank || 4,
                                            alpha: trainingSettings.loraConfig?.alpha || 8,
                                            variables: ['*'],
                                        });
                                        model.attachLoRA(name);
                                    } catch (e) {
                                        console.error('Failed to create LoRA:', e);
                                        return;
                                    }
                                    setLoras(model.listLoRAs());
                                    setAddNew(false);
                                    onSelect(() => name);
                                }
                            }}
                        />
                    </li>
                )}
            </ul>
            <div className={style.addButton}>
                {progress !== null && (
                    <>
                        <LinearProgress
                            sx={{ width: 'calc(100% - 2rem)', margin: '1rem' }}
                            variant="determinate"
                            value={progress * 100}
                        />
                        <Tooltip title={t('instruct.stopTraining')}>
                            <IconButton
                                color="primary"
                                onClick={onStop}
                            >
                                <StopCircleIcon
                                    fontSize="large"
                                    color="inherit"
                                />
                            </IconButton>
                        </Tooltip>
                    </>
                )}
                {progress === null && (
                    <>
                        {extraActions}
                        <Tooltip title={t('instruct.addLoRA')}>
                            <IconButton
                                color="primary"
                                disabled={!model || !ready}
                                onClick={() => {
                                    if (!model) return;
                                    setAddNew(true);
                                }}
                            >
                                <AddIcon
                                    fontSize="large"
                                    color="inherit"
                                />
                            </IconButton>
                        </Tooltip>
                    </>
                )}
            </div>
        </div>
    );
}
