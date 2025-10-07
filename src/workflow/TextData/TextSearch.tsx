import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, FormControl, IconButton, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import DataCardView from '../../components/DataCardView/DataCardView';
import { DataRowSet } from '../../components/DataCardRow/DataCardRow';
import style from './style.module.css';
import CloseIcon from '@mui/icons-material/Close';
import Downloader from '../../utilities/downloader';
import DownloadProgress from '../../components/DownloadProgress/DownloadProgress';
import { DataCardItem } from '../../components/DataCard/type';

interface DataSetManifest {
    dataSets: DataCardItem[];
    categories: Record<string, { name: string; dataSetIds: string[] }[]>;
    languages: Record<string, string>;
}

function groupByCategory(lang: string, manifest: DataSetManifest | null): DataRowSet[] {
    if (!manifest) return [];
    const itemMap = new Map(manifest.dataSets.map((item) => [item.id, item]));
    return (manifest.categories[lang] || []).map((cat) => ({
        title: cat.name,
        cards: cat.dataSetIds.map((id) => itemMap.get(id)).filter((item): item is DataCardItem => item !== undefined),
    }));
}

interface Props {
    onDownload(downloader: Downloader): void;
    downloads: Downloader[];
    onClose: () => void;
    selectedSet?: Set<string>;
}

export default function TextSearch({ onDownload, downloads, onClose, selectedSet }: Props) {
    const { t } = useTranslation();
    const [lang, setLang] = useState(navigator.language.split('-')[0]);
    const [langs, setLangs] = useState<{ code: string; name: string }[]>([]);
    //const [manifest, setManifest] = useState<DataSetManifest | null>(null);
    const [dataRows, setDataRows] = useState<DataRowSet[]>([]);

    useEffect(() => {
        fetch('/dataManifest.json')
            .then((res) => res.json())
            .then((data: DataSetManifest) => {
                //setManifest(data);
                setDataRows(groupByCategory(lang, data));
                setLangs(Object.entries(data.languages).map(([code, name]) => ({ code, name })));
            })
            .catch(() => setDataRows([]));
    }, [lang]);

    return (
        <Dialog
            open
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            sx={{ '& .MuiPaper-root': { margin: '0', borderRadius: '0' } }}
        >
            <DialogContent sx={{ padding: '0' }}>
                <div className={style.headerBar}>
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
                    <div style={{ flexGrow: 1 }} />
                    <DownloadProgress downloads={downloads} />
                    <IconButton
                        onClick={onClose}
                        aria-label={t('data.close')}
                    >
                        <CloseIcon fontSize="large" />
                    </IconButton>
                </div>
                <DataCardView
                    data={dataRows}
                    onSelect={(_, downloader) => {
                        onDownload(downloader);
                    }}
                    selectedSet={selectedSet}
                />
            </DialogContent>
        </Dialog>
    );
}
