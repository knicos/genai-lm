import { Dispatch, RefObject, useEffect, useRef, useState } from 'react';
import style from './style.module.css';
import { loadTextData } from '@genai-fi/nanogpt';
import { useTranslation } from 'react-i18next';
import TextInput from './TextInput';
import DataListing from './DataListing';
import DataMenu from './DataMenu';
import { useDrop } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';
import InfoPanel from './InfoPanel';
import TextSearch from './TextSearch';
import Box from '../../components/BoxTitle/Box';
import DataRows from './DataRows';
import { v4 as uuid } from 'uuid';
import logger from '../../utilities/logger';
import useModelStatus from '../../hooks/useModelStatus';
import BoxNotice, { Notice } from '../../components/BoxTitle/BoxNotice';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { dataEntries, DataEntry, dataReady, datasetAtom, downloadsAtom } from '../../state/data';
import { modelAtom } from '../../state/model';

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

export default function TextData() {
    const { t } = useTranslation();
    const [, setBusy] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const [data, setData] = useAtom(dataEntries);
    const setDataset = useSetAtom(datasetAtom);
    const [showInput, setShowInput] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const model = useAtomValue(modelAtom);
    const [selected, setSelected] = useState<number>(-1);
    const [downloads, setDownloads] = useAtom(downloadsAtom);
    const [selectedSet, setSelectedSet] = useState<Set<string>>();
    const status = useModelStatus(model ?? undefined);
    const [message, setMessage] = useState<Notice | null>(null);
    const done = useAtomValue(dataReady);

    const disable = status === 'training' || status === 'busy';

    useEffect(() => {
        const newDataset = data.map((entry) => entry.content).flat();
        setSelectedSet(new Set(data.map((entry) => entry.id)));
        setDataset(newDataset);
    }, [data, setDataset]);

    const [dropProps, drop] = useDrop(
        {
            accept: [NativeTypes.URL, NativeTypes.HTML, NativeTypes.FILE, NativeTypes.TEXT],
            async drop(items: DragObject) {
                setBusy(true);
                if (items.files) {
                    logger.log({ action: 'dropped_files', count: items.files.length });
                    try {
                        for (const file of items.files) {
                            const text = await loadTextData(file, { maxSize: 200000000 });
                            await handleTextLoad(uuid(), file.name, text, 'file', setData);
                        }
                    } catch (error) {
                        logger.error({ errorString: JSON.stringify(error) });
                        setMessage({
                            level: 'warning',
                            notice: t('data.errors.fileLoadError'),
                        });
                    }
                } else if (items.text) {
                    logger.log({ action: 'dropped_text' });
                    await handleTextLoad(uuid(), t('data.untitled'), [items.text], 'input', setData);
                } else if (items.html) {
                    logger.log({ action: 'dropped_html' });
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

    const selectedItem = selected >= 0 && selected < data.length ? data[selected] : null;

    return (
        <Box
            widget="textData"
            style={{ flexGrow: 1 }}
            active={done}
            disabled={disable}
            fullWidth
        >
            <div className={style.container}>
                <DataMenu
                    disabled={showInput || showSearch}
                    onWrite={() => {
                        setSelected(-1);
                        setShowInput(true);
                    }}
                    onSearch={() => setShowSearch(true)}
                    onUpload={() => fileRef.current?.click()}
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
                                    logger.log({ action: 'added_input_text', size: text.length });
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
                                downloader.on('error', () => {
                                    setDownloads((prev) => prev.filter((d) => d !== downloader));
                                    setMessage({
                                        level: 'error',
                                        notice: t('data.errors.downloadLoadError'),
                                    });
                                });
                                downloader.on('cancel', () => {
                                    setDownloads((prev) => prev.filter((d) => d !== downloader));
                                });
                                downloader.on('end', async (file) => {
                                    logger.log({ action: 'download_completed', name: file.name });
                                    try {
                                        const text = loadTextData(file, { maxSize: 200000000 });
                                        await handleTextLoad(downloader.id, file.name, await text, 'search', setData);
                                    } catch {
                                        setMessage({
                                            level: 'error',
                                            notice: t('data.errors.downloadLoadError'),
                                        });
                                    }
                                    setDownloads((prev) => prev.filter((d) => d !== downloader));
                                });
                            }}
                        />
                    )}
                    {dropProps.hovered && <div className={style.dropHint}>{t('data.dropHint')}</div>}
                </div>

                <input
                    type="file"
                    accept=".txt,.csv,.pdf,.doc,.docx,.parquet,.json,.jsonl"
                    ref={fileRef}
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                        if (e.target.files && e.target.files.length > 0) {
                            const file = e.target.files[0];
                            setBusy(true);
                            logger.log({ action: 'file_input_selected', name: file.name });
                            const text = await loadTextData(file, { maxSize: 200000000 });
                            await handleTextLoad(uuid(), file.name, text, 'file', setData);
                            setBusy(false);
                        }
                    }}
                />
                {message && (
                    <BoxNotice
                        notice={message}
                        onClose={() => setMessage(null)}
                    />
                )}
            </div>
        </Box>
    );
}
