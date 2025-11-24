import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, FormControl, IconButton, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import style from './style.module.css';
import CloseIcon from '@mui/icons-material/Close';
import { TeachableLLM } from '@genai-fi/nanogpt';
import CardView from '../../components/CardView/CardView';
import ModelCard from '../../components/ModelCard/ModelCard';
import { RowSet } from '../../components/CardRow/CardRow';
import { ModelCardItem } from '../../components/ModelCard/type';
import Downloader from '../../utilities/downloader';
import DownloadProgress from '../../components/DownloadProgress/DownloadProgress';
import { Spinner } from '@genai-fi/base';

interface ModelManifest {
    models: ModelCardItem[];
    categories: Record<string, { name: string; modelIds: string[] }[]>;
    languages: Record<string, string>;
}

function groupByCategory(lang: string, manifest: ModelManifest | null): RowSet<ModelCardItem>[] {
    if (!manifest) return [];
    const itemMap = new Map(manifest.models.map((item) => [item.id, item]));
    return (manifest.categories[lang] || []).map((cat) => ({
        title: cat.name,
        cards: cat.modelIds.map((id) => itemMap.get(id)).filter((item): item is ModelCardItem => item !== undefined),
    }));
}

interface Props {
    model?: TeachableLLM;
    onModel(model: TeachableLLM): void;
    onClose: () => void;
    selectedSet?: Set<string>;
}

export default function ModelSearch({ model, onModel, onClose, selectedSet }: Props) {
    const { t, i18n } = useTranslation();
    const [lang, setLang] = useState(i18n.language.split('-')[0]);
    const [langs, setLangs] = useState<{ code: string; name: string }[]>([]);
    //const [manifest, setManifest] = useState<DataSetManifest | null>(null);
    const [dataRows, setDataRows] = useState<RowSet<ModelCardItem>[]>([]);
    const [download, setDownload] = useState<Downloader | null>(null);
    const [open, setOpen] = useState(true);

    useEffect(() => {
        if (!open) {
            const timer = setTimeout(() => {
                onClose();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [open, onClose]);

    useEffect(() => {
        fetch('https://store.gen-ai.fi/llm/modelManifest.json')
            .then((res) => res.json())
            .then((data: ModelManifest) => {
                setDataRows(groupByCategory(lang, data));
                setLangs(Object.entries(data.languages).map(([code, name]) => ({ code, name })));
            })
            .catch(() => setDataRows([]));
    }, [lang]);

    const handleSelect = useCallback(
        (card: ModelCardItem, downloader?: Downloader) => {
            if (model) {
                console.log('Disposing old model');
                try {
                    model.dispose();
                } catch (e) {
                    console.error('Error disposing old model:', e);
                    return;
                }
            }
            if (downloader) {
                setDownload(downloader);
                downloader.on('end', (file: File) => {
                    const newModel = TeachableLLM.loadModel(file);
                    newModel.meta.id = card.id;
                    newModel.meta.name = card.name;
                    newModel.meta.trained = card.trained || true;
                    onModel(newModel);
                    setDownload(null);
                });
            } else if (!card.url) {
                const newModel = TeachableLLM.create(card.tokeniser || 'char', card.config);
                newModel.meta.id = card.id;
                newModel.meta.name = card.name;
                newModel.meta.trained = false;
                onModel(newModel);
            }
        },
        [model, onModel]
    );

    return (
        <Dialog
            open={open}
            onClose={() => setOpen(false)}
            maxWidth="lg"
            fullWidth
            sx={{ '& .MuiPaper-root': { margin: '0', borderRadius: '0' } }}
        >
            <DialogContent sx={{ padding: '0' }}>
                <div className={style.headerBar}>
                    {langs.length > 0 && (
                        <FormControl size="small">
                            <Select
                                aria-label={t('data.language')}
                                value={lang}
                                onChange={(e: SelectChangeEvent) => setLang(e.target.value)}
                            >
                                {langs.map((l) => (
                                    <MenuItem
                                        key={l.code}
                                        value={l.code}
                                    >
                                        {l.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                    <div style={{ flexGrow: 1 }} />
                    <DownloadProgress downloads={download ? [download] : []} />
                    <IconButton
                        onClick={() => setOpen(false)}
                        aria-label={t('data.close')}
                    >
                        <CloseIcon fontSize="large" />
                    </IconButton>
                </div>
                {dataRows.length === 0 && <Spinner />}
                <CardView
                    data={dataRows}
                    onSelect={handleSelect}
                    selectedSet={selectedSet}
                    CardComponent={ModelCard}
                />
            </DialogContent>
        </Dialog>
    );
}
