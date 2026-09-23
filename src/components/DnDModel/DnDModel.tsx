import { Button, Spinner } from '@genai-fi/base';
import style from './style.module.css';
import { useTranslation } from 'react-i18next';
import { useState, useRef, RefObject, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';
import BoxNotice, { Notice } from '../BoxTitle/BoxNotice';
import { useAtom } from 'jotai';
import { modelAtom } from '../../state/model';
import { TeachableLLM } from '@genai-fi/nanogpt';
import SearchIcon from '@mui/icons-material/Search';
import UploadIcon from '@mui/icons-material/Upload';

interface DragObject {
    files?: File[];
    html?: string;
    text?: string;
    items: DataTransferItemList;
    dataTransfer: DataTransfer;
}

interface Props {
    onSearch: () => void;
}

export default function DnDModel({ onSearch }: Props) {
    const { t } = useTranslation();
    const [message, setMessage] = useState<Notice | null>(null);
    const fileRef = useRef<HTMLInputElement | null>(null);
    const [model, setModel] = useAtom(modelAtom);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (model) {
            if (!model.loaded) {
                setBusy(true);
            }
            model.on('loaded', () => {
                setBusy(false);
            });
        }
    }, [model]);

    const [dropProps, drop] = useDrop(
        {
            accept: [NativeTypes.URL, NativeTypes.FILE],
            async drop(items: DragObject) {
                if (items.files) {
                    try {
                        const file = items.files[0];
                        if (file) {
                            setBusy(true);
                            const model = TeachableLLM.loadModel(file);
                            setModel(model);
                        }
                    } catch (error) {
                        console.error(error);
                        setMessage({
                            level: 'warning',
                            notice: t('data.errors.fileLoadError'),
                        });
                    }
                }
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

    return busy ? (
        <Spinner size="large" />
    ) : (
        <div
            className={`${style.dndModel} ${dropProps.hovered ? style.dndhover : ''}`}
            ref={drop as unknown as RefObject<HTMLDivElement>}
        >
            <h2>{t('app.dndmodel.title')}</h2>
            <p>{t('app.dndmodel.description')}</p>
            <div className={style.buttonRow}>
                <Button
                    variant="outlined"
                    onClick={() => fileRef.current?.click()}
                    startIcon={<UploadIcon />}
                >
                    {t('app.dndmodel.upload')}
                </Button>
                <Button
                    variant="outlined"
                    onClick={onSearch}
                    startIcon={<SearchIcon />}
                >
                    {t('app.dndmodel.search')}
                </Button>
            </div>
            <input
                type="file"
                accept=".zip"
                ref={fileRef}
                style={{ display: 'none' }}
                onChange={async (e) => {
                    if (e.target.files && e.target.files.length > 0) {
                        setBusy(true);
                        const file = e.target.files[0];
                        const model = TeachableLLM.loadModel(file);
                        setModel(model);
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
    );
}
