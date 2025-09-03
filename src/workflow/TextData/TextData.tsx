import { Dispatch, RefObject, useEffect, useRef, useState } from 'react';
import style from './style.module.css';
import { loadTextData, TeachableLLM } from '@genai-fi/nanogpt';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import useModelStatus from '../../utilities/useModelStatus';
import { useTranslation } from 'react-i18next';
import TextInput from './TextInput';
import DataListing, { DataEntry } from './DataListing';
import DataMenu from './DataMenu';
import { useDrop } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';
import InfoPanel from './InfoPanel';

interface Props {
    model?: TeachableLLM;
    dataset?: string[];
    onDatasetChange: (dataset: string[]) => void;
}

interface DragObject {
    files?: File[];
    html?: string;
    text?: string;
    items: DataTransferItemList;
    dataTransfer: DataTransfer;
}

function handleTextLoad(
    name: string,
    text: string[],
    model: TeachableLLM | undefined,
    setData: Dispatch<React.SetStateAction<DataEntry[]>>
) {
    if (!model) return;

    const tokeniser = model.tokeniser;
    if (tokeniser && !tokeniser.trained) {
        tokeniser.train(text);
    }

    setData((prev) => [
        ...prev,
        {
            name,
            content: text,
            size: text.reduce((acc, curr) => acc + curr.length, 0),
        },
    ]);
}

export default function TextData({ model, onDatasetChange }: Props) {
    const { t } = useTranslation();
    const [done, setDone] = useState(false);
    const [busy, setBusy] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const status = useModelStatus(model);
    const [data, setData] = useState<DataEntry[]>([]);
    const [showInput, setShowInput] = useState(false);
    const [showDropError, setShowDropError] = useState(false);

    useEffect(() => {
        const newDataset = data.map((entry) => entry.content).flat();
        onDatasetChange(newDataset);
    }, [data, onDatasetChange]);

    const [dropProps, drop] = useDrop(
        {
            accept: [NativeTypes.URL, NativeTypes.HTML, NativeTypes.FILE, NativeTypes.TEXT],
            async drop(items: DragObject) {
                setBusy(true);
                console.log(items);
                if (items.files) {
                    try {
                        for (const file of items.files) {
                            const text = await loadTextData(file);
                            handleTextLoad(file.name, text, model, setData);
                        }
                    } catch (error) {
                        console.error('Error loading files:', error);
                        setShowDropError(true);
                    }
                } else if (items.text) {
                    handleTextLoad(t('data.untitled'), [items.text], model, setData);
                } else if (items.html) {
                    const element = document.createElement('div');
                    element.innerHTML = items.html;
                    handleTextLoad(t('data.untitled'), [element.textContent], model, setData);
                }
                setDone(true);
                setBusy(false);
            },
            collect(monitor) {
                const can = monitor.canDrop();
                return {
                    highlighted: can,
                    hovered: monitor.isOver(),
                };
            },
        },
        []
    );

    return (
        <div className={style.container}>
            <BoxTitle
                title={t('data.title')}
                done={done}
                busy={busy}
            />
            <DataMenu
                disabled={(status !== 'ready' && status !== 'awaitingTokens') || !model || showInput}
                onWrite={() => setShowInput(true)}
                onUpload={() => fileRef.current?.click()}
            />
            <div
                className={style.content}
                ref={drop as unknown as RefObject<HTMLDivElement>}
            >
                <DataListing
                    data={data}
                    onDelete={(index) => setData((prev) => prev.filter((_, i) => i !== index))}
                />
                <InfoPanel
                    show={data.length === 0 && !!model}
                    severity="info"
                    message={t('data.dataHint')}
                />
                <InfoPanel
                    show={data.length === 0 && !model}
                    severity="warning"
                    message={t('data.modelHint')}
                />
                <InfoPanel
                    show={showDropError}
                    severity="error"
                    message={t('data.dropError')}
                    onClose={() => setShowDropError(false)}
                />

                {showInput && (
                    <TextInput
                        onClose={() => setShowInput(false)}
                        onText={(text) => {
                            setData((prev) => [
                                ...prev,
                                {
                                    name: t('data.untitled'),
                                    content: [text],
                                    size: text.length,
                                },
                            ]);
                            setShowInput(false);
                        }}
                    />
                )}
                {dropProps.hovered && <div className={style.dropHint}>{t('data.dropHint')}</div>}
            </div>

            <input
                type="file"
                accept=".txt,.csv,.pdf,.doc,.docx"
                ref={fileRef}
                style={{ display: 'none' }}
                onChange={async (e) => {
                    if (e.target.files && e.target.files.length > 0) {
                        const file = e.target.files[0];
                        setBusy(true);
                        const text = await loadTextData(file);
                        handleTextLoad(file.name, text, model, setData);
                        setDone(true);
                        setBusy(false);
                    }
                }}
            />
        </div>
    );
}
