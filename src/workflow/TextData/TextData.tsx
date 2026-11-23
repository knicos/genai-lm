import { Dispatch, RefObject, useRef, useState } from 'react';
import style from './style.module.css';
import { ConversationStream, Conversation, data as dataModule } from '@genai-fi/nanogpt';
import { useTranslation } from 'react-i18next';
import TextInput from './TextInput';
import DataListing from './DataListing';
import DataMenu from './DataMenu';
import { useDrop } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';
import TextSearch from './TextSearch';
import Box from '../../components/BoxTitle/Box';
import { v4 as uuid } from 'uuid';
import useModelStatus from '../../hooks/useModelStatus';
import BoxNotice, { Notice } from '../../components/BoxTitle/BoxNotice';
import { useAtom, useAtomValue } from 'jotai';
import { dataEntries, DataEntry } from '../../state/data';
import { loadedModelAtom } from '../../state/model';
import ProgressiveDocumentFeed from './ProgressiveDocumentFeed';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import CloseIcon from '@mui/icons-material/Close';
import { Button, Help } from '@genai-fi/base';

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
    text: ConversationStream | Conversation[][],
    source: 'file' | 'input' | 'search',
    setData: Dispatch<React.SetStateAction<DataEntry[]>>
) {
    setData((prev) => [...prev, new DataEntry(id, name, text, source)]);
}

export default function TextData() {
    const { t } = useTranslation();
    const [, setBusy] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const [data, setData] = useAtom(dataEntries);
    //const setDataset = useSetAtom(datasetAtom);
    const [showInput, setShowInput] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const model = useAtomValue(loadedModelAtom);
    const [selected, setSelected] = useState<number>(-1);
    //const [downloads, setDownloads] = useAtom(downloadsAtom);
    const status = useModelStatus(model ?? undefined);
    const [message, setMessage] = useState<Notice | null>(null);

    const disable = status === 'training' || status === 'busy';

    const selectedSet = new Set(data.map((entry) => entry.id));

    /*const doUpdate = useCallback(() => {
        const newDataset = data.map((entry) => entry.content).flat();
        //setDataset(newDataset);
    }, [data, setDataset]);*/

    const [dropProps, drop] = useDrop(
        {
            accept: [NativeTypes.URL, NativeTypes.HTML, NativeTypes.FILE, NativeTypes.TEXT],
            async drop(items: DragObject) {
                setBusy(true);
                if (items.files) {
                    try {
                        for (const file of items.files) {
                            const text = await dataModule.loadTextData(file, { maxSize: 200000000 });
                            await handleTextLoad(uuid(), file.name, text, 'file', setData);
                        }
                    } catch {
                        setMessage({
                            level: 'warning',
                            notice: t('data.errors.fileLoadError'),
                        });
                    }
                } else if (items.text) {
                    await handleTextLoad(
                        uuid(),
                        t('data.untitled'),
                        [[{ role: 'text', content: items.text }]],
                        'input',
                        setData
                    );
                } else if (items.html) {
                    const element = document.createElement('div');
                    element.innerHTML = items.html;
                    await handleTextLoad(
                        uuid(),
                        t('data.untitled'),
                        [[{ role: 'text', content: element.textContent }]],
                        'input',
                        setData
                    );
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
        <Help
            widget="textData"
            message={t('data.help')}
            active={!!model && data.length > 0}
            keepOpen
            placement="right"
        >
            <Box
                widget="textData"
                style={{ width: '30rem' }}
                active={!!model && data.length > 0}
                disabled={disable}
                useParent
            >
                <div className={style.container}>
                    <BoxTitle
                        title={t('data.title')}
                        status={data.length > 0 ? 'done' : 'waiting'}
                    />
                    <DataMenu
                        disabled={showInput || showSearch}
                        onWrite={() => {
                            setSelected(-1);
                            setData((prev) => [
                                ...prev,
                                new DataEntry(uuid(), t('data.untitled'), [[{ role: 'text', content: '' }]], 'input'),
                            ]);
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
                            onDelete={(index) =>
                                setData((prev) =>
                                    prev.filter((entry, i) => {
                                        if (i === index) {
                                            entry.dispose();
                                        }
                                        return i !== index;
                                    })
                                )
                            }
                            selected={selected}
                            setSelected={setSelected}
                        />

                        {selected >= 0 && (
                            <div className={style.dataListContainer}>
                                <ProgressiveDocumentFeed
                                    data={selected >= 0 ? data[selected] : null}
                                    initialCount={8}
                                    step={6}
                                    rootMargin="800px"
                                />
                                <div className={style.closeDataButton}>
                                    <Button
                                        variant="contained"
                                        onClick={() => setSelected(-1)}
                                        startIcon={<CloseIcon color="inherit" />}
                                    >
                                        {t('data.close')}
                                    </Button>
                                </div>
                            </div>
                        )}
                        {showInput && (
                            <TextInput
                                initialText={
                                    selectedItem && selectedItem.source === 'input'
                                        ? selectedItem.content?.[0][0].content
                                        : undefined
                                }
                                onClose={() => setShowInput(false)}
                                onText={(text) => {
                                    if (selectedItem) {
                                        setData((prev) =>
                                            prev.map((entry, i) => {
                                                if (i === selected) {
                                                    entry.content = [[{ role: 'text', content: text }]];
                                                }

                                                return entry;
                                            })
                                        );
                                    } else {
                                        setData((prev) => [
                                            ...prev,
                                            new DataEntry(
                                                uuid(),
                                                t('data.untitled'),
                                                [[{ role: 'text', content: text }]],
                                                'input'
                                            ),
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
                                downloads={[]}
                                onDownload={(downloader) => {
                                    setData((prev) => [
                                        ...prev,
                                        new DataEntry(downloader.id, downloader.name, downloader, 'search'),
                                    ]);
                                }}
                            />
                        )}
                        {dropProps.hovered && <div className={style.dropHint}>{t('data.dropHint')}</div>}
                    </div>

                    <input
                        type="file"
                        accept=".txt,.csv,.pdf,.doc,.docx,.parquet,.json,.jsonl,.zip"
                        ref={fileRef}
                        style={{ display: 'none' }}
                        onChange={async (e) => {
                            if (e.target.files && e.target.files.length > 0) {
                                const file = e.target.files[0];
                                setBusy(true);
                                const text = await dataModule.loadTextData(file, { maxSize: 200000000 });
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
        </Help>
    );
}
