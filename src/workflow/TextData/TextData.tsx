import { Dispatch, RefObject, useEffect, useMemo, useRef, useState } from 'react';
import style from './style.module.css';
import { loadTextData, TeachableLLM } from '@genai-fi/nanogpt';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import { useTranslation } from 'react-i18next';
import TextInput from './TextInput';
import DataListing, { DataEntry } from './DataListing';
import DataMenu from './DataMenu';
import { useDrop } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';
import InfoPanel from './InfoPanel';
import DataProgress from '../../components/DataProgress/DataProgress';
import TextSearch from './TextSearch';
import useModelStatus from '../../utilities/useModelStatus';
import Box from '../../components/BoxTitle/Box';
import DataRows from './DataRows';

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

async function handleTextLoad(
    name: string,
    text: string[],
    model: TeachableLLM | undefined,
    source: 'file' | 'input' | 'search',
    setData: Dispatch<React.SetStateAction<DataEntry[]>>
) {
    if (model) {
        const tokeniser = model.tokeniser;
        if (tokeniser && !tokeniser.trained) {
            await tokeniser.train(text);
        }
    }

    setData((prev) => [
        ...prev,
        {
            name,
            content: text,
            size: text.reduce((acc, curr) => acc + curr.length, 0),
            source,
        },
    ]);
}

export default function TextData({ model, onDatasetChange }: Props) {
    const { t } = useTranslation();
    const [done, setDone] = useState(false);
    const [busy, setBusy] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const [data, setData] = useState<DataEntry[]>([]);
    const [showInput, setShowInput] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [showDropError, setShowDropError] = useState(false);
    const status = useModelStatus(model);
    const [selected, setSelected] = useState<number>(-1);

    useEffect(() => {
        const newDataset = data.map((entry) => entry.content).flat();
        onDatasetChange(newDataset);
    }, [data, onDatasetChange]);

    const [dropProps, drop] = useDrop(
        {
            accept: [NativeTypes.URL, NativeTypes.HTML, NativeTypes.FILE, NativeTypes.TEXT],
            async drop(items: DragObject) {
                setBusy(true);
                if (items.files) {
                    try {
                        for (const file of items.files) {
                            const text = await loadTextData(file);
                            await handleTextLoad(file.name, text, model, 'file', setData);
                        }
                    } catch (error) {
                        console.error('Error loading files:', error);
                        setShowDropError(true);
                    }
                } else if (items.text) {
                    await handleTextLoad(t('data.untitled'), [items.text], model, 'input', setData);
                } else if (items.html) {
                    const element = document.createElement('div');
                    element.innerHTML = items.html;
                    await handleTextLoad(t('data.untitled'), [element.textContent], model, 'input', setData);
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
        [model]
    );

    const totalSamples = useMemo(
        () => data.reduce((acc, entry) => acc + entry.content.reduce((acc, curr) => acc + curr.length, 0), 0),
        [data]
    );

    const selectedItem = selected >= 0 && selected < data.length ? data[selected] : null;

    return (
        <Box
            widget="textData"
            style={{ maxWidth: '390px', marginBottom: '5rem' }}
            active={data.length > 0}
        >
            <div className={style.container}>
                <BoxTitle
                    title={t('data.title')}
                    done={done}
                    busy={busy}
                />
                <DataMenu
                    disabled={showInput || showSearch}
                    onWrite={() => {
                        setSelected(-1);
                        setShowInput(true);
                    }}
                    onSearch={() => setShowSearch(true)}
                    onUpload={() => fileRef.current?.click()}
                    totalSamples={totalSamples}
                />
                <DataProgress
                    samplesProcessed={totalSamples}
                    desiredSamples={status !== 'loading' ? (model?.getNumParams() || 0) * 2 : 0}
                />
                <div
                    className={style.content}
                    ref={drop as unknown as RefObject<HTMLDivElement>}
                >
                    <DataListing
                        data={data}
                        onDelete={(index) => setData((prev) => prev.filter((_, i) => i !== index))}
                        selected={selected}
                        setSelected={(index: number) => {
                            setSelected(index);
                            if (index >= 0 && index < data.length) {
                                const entry = data[index];
                                if (entry.source === 'input') {
                                    setShowInput(true);
                                }
                            }
                        }}
                    />
                    <InfoPanel
                        show={data.length === 0}
                        severity="info"
                        message={t('data.dataHint')}
                    />
                    <InfoPanel
                        show={showDropError}
                        severity="error"
                        message={t('data.dropError')}
                        onClose={() => setShowDropError(false)}
                    />
                    {selectedItem?.source === 'file' || selectedItem?.source === 'search' ? (
                        <DataRows
                            data={selectedItem}
                            onClose={() => setSelected(-1)}
                        />
                    ) : null}
                    {showInput && (
                        <TextInput
                            initialText={
                                selectedItem && selectedItem.source === 'input' ? selectedItem.content[0] : undefined
                            }
                            onClose={() => setShowInput(false)}
                            onText={(text) => {
                                if (selectedItem) {
                                    setData((prev) =>
                                        prev.map((entry, i) =>
                                            i === selected
                                                ? {
                                                      ...entry,
                                                      content: [text],
                                                      size: text.length,
                                                  }
                                                : entry
                                        )
                                    );
                                } else {
                                    setData((prev) => [
                                        ...prev,
                                        {
                                            name: t('data.untitled'),
                                            content: [text],
                                            size: text.length,
                                            source: 'input',
                                        },
                                    ]);
                                }
                                setShowInput(false);
                            }}
                        />
                    )}
                    {showSearch && (
                        <TextSearch
                            onClose={() => setShowSearch(false)}
                            onText={async (url, name, type) => {
                                setShowSearch(false);
                                setBusy(true);

                                const response = await fetch(url);
                                const text = await loadTextData(
                                    new File([await response.blob()], name, {
                                        type,
                                    })
                                );
                                await handleTextLoad(name, text, model, 'search', setData);
                                setBusy(false);
                            }}
                        />
                    )}
                    {dropProps.hovered && <div className={style.dropHint}>{t('data.dropHint')}</div>}
                </div>

                <input
                    type="file"
                    accept=".txt,.csv,.pdf,.doc,.docx,.parquet"
                    ref={fileRef}
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                        if (e.target.files && e.target.files.length > 0) {
                            const file = e.target.files[0];
                            setBusy(true);
                            const text = await loadTextData(file, { maxSize: 100000000 });
                            await handleTextLoad(file.name, text, model, 'file', setData);
                            setDone(true);
                            setBusy(false);
                        }
                    }}
                />
            </div>
        </Box>
    );
}
