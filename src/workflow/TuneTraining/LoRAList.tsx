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
import { IconButton, Tooltip } from '@mui/material';

interface Props {
    model: TeachableLLM | null;
    selected: string | null;
    extraActions?: React.ReactNode;
    onSelect: (fn: (prev: string | null) => string | null) => void;
}

export default function LoRAList({ model, onSelect, selected, extraActions }: Props) {
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
                        onClick={() => onSelect(() => null)}
                        selected={selected === null}
                        text={t('instruct.noLoRA')}
                        off
                    />
                </li>
                {loras.map((lora) => (
                    <li key={lora}>
                        <LoRAItem
                            text={lora}
                            selected={selected === lora}
                            onClick={() => {
                                onSelect(() => lora);
                            }}
                            onDelete={() => {
                                if (!model) return;
                                try {
                                    model.model.deleteLoRA(lora);
                                } catch (e) {
                                    console.error('Failed to delete LoRA:', e);
                                    return;
                                }
                                setLoras(model.model.listLoRAs());
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
                                        model.model.createLoRA(name, {
                                            rank: trainingSettings.loraConfig?.rank || 4,
                                            alpha: trainingSettings.loraConfig?.alpha || 8,
                                            variables: ['*'],
                                        });
                                    } catch (e) {
                                        console.error('Failed to create LoRA:', e);
                                        return;
                                    }
                                    setLoras(model.model.listLoRAs());
                                    setAddNew(false);
                                }
                            }}
                        />
                    </li>
                )}
                <li className={style.addButton}>
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
                </li>
            </ul>
        </div>
    );
}
