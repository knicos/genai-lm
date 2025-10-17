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
import Box from '../../components/BoxTitle/Box';
import DataRows from './DataRows';
import Downloader from '../../utilities/downloader';
import { v4 as uuid } from 'uuid';
import logger from '../../utilities/logger';
import useModelLoaded from '../../utilities/useModelLoaded';

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
    id: string,
    name: string,
    text: string[],
    source: 'file' | 'input' | 'search',
    setData: Dispatch<React.SetStateAction<DataEntry[]>>
) {
    setData((prev) => [
        ...prev,
        {
            id,
            name,
            content: text,
            size: text.reduce((acc, curr) => acc + curr.length, 0),
            source,
        },
    ]);
}

export default function TextData({ model, onDatasetChange }: Props) {
    const { t } = useTranslation();
    const [busy, setBusy] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const [data, setData] = useState<DataEntry[]>([]);
    const [showInput, setShowInput] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [showDropError, setShowDropError] = useState(false);
    const ready = useModelLoaded(model);
    const [selected, setSelected] = useState<number>(-1);
    const [downloads, setDownloads] = useState<Downloader[]>([]);
    const [selectedSet, setSelectedSet] = useState<Set<string>>();

    const done = data.length > 0;

    useEffect(() => {
        const newDataset = data.map((entry) => entry.content).flat();
        setSelectedSet(new Set(data.map((entry) => entry.id)));
        onDatasetChange(newDataset);
    }, [data, onDatasetChange]);

    const [dropProps, drop] = useDrop(
        {
            accept: [NativeTypes.URL, NativeTypes.HTML, NativeTypes.FILE, NativeTypes.TEXT],
            async drop(items: DragObject) {
                setBusy(true);
                if (items.files) {
                    logger.log(`Loading ${items.files.length} dropped file(s)`);
                    try {
                        for (const file of items.files) {
                            const text = await loadTextData(file, { maxSize: 200000000 });
                            await handleTextLoad(uuid(), file.name, text, 'file', setData);
                        }
                    } catch (error) {
                        console.error('Error loading files:', error);
                        setShowDropError(true);
                    }
                } else if (items.text) {
                    logger.log('Loading dropped text');
                    await handleTextLoad(uuid(), t('data.untitled'), [items.text], 'input', setData);
                } else if (items.html) {
                    logger.log('Loading dropped HTML content');
                    const element = document.createElement('div');
                    element.innerHTML = items.html;
                    await handleTextLoad(uuid(), t('data.untitled'), [element.textContent], 'input', setData);
                }
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
            disabled={status === 'training'}
        >
            <div className={style.container}>
                <BoxTitle
                    title={t('data.title')}
                    status={busy || downloads.length > 0 ? 'busy' : done ? 'done' : 'waiting'}
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
                                    logger.log('Creating new text input');
                                    setData((prev) => [
                                        ...prev,
                                        {
                                            id: uuid(),
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
                            selectedSet={selectedSet}
                            onClose={() => setShowSearch(false)}
                            downloads={downloads}
                            onDownload={(downloader) => {
                                setDownloads((prev) => [...prev, downloader]);
                                downloader.on('end', async (file) => {
                                    logger.log(`Loading searched file: ${file.name}`);
                                    const text = loadTextData(file, { maxSize: 200000000 });
                                    await handleTextLoad(downloader.id, file.name, await text, 'search', setData);
                                    setDownloads((prev) => prev.filter((d) => d !== downloader));
                                });
                            }}
                        />
                    )}
                    {dropProps.hovered && <div className={style.dropHint}>{t('data.dropHint')}</div>}
                </div>
                {ready && (
                    <DataProgress
                        samplesProcessed={totalSamples}
                        desiredSamples={(model?.getNumParams() || 0) * 2}
                    />
                )}

                <input
                    type="file"
                    accept=".txt,.csv,.pdf,.doc,.docx,.parquet"
                    ref={fileRef}
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                        if (e.target.files && e.target.files.length > 0) {
                            const file = e.target.files[0];
                            setBusy(true);
                            logger.log('Loading opened file');
                            const text = await loadTextData(file, { maxSize: 200000000 });
                            await handleTextLoad(uuid(), file.name, text, 'file', setData);
                            setBusy(false);
                        }
                    }}
                />
            </div>
        </Box>
    );
}
