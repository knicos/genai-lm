import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, FormControl, IconButton, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import DataCardView from '../../components/DataCardView/DataCardView';
import { DataCardItem } from '../../components/DataCard/DataCard';
import { DataRowSet } from '../../components/DataCardRow/DataCardRow';
import style from './style.module.css';
import CloseIcon from '@mui/icons-material/Close';

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
    onText: (text: string, name: string, type: string) => void;
    onClose: () => void;
}

export default function TextSearch({ onText, onClose }: Props) {
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
            sx={{ '& .MuiPaper-root': { maxHeight: 'unset', height: '100%', margin: '0', borderRadius: '0' } }}
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
                    <IconButton
                        onClick={onClose}
                        aria-label={t('data.close')}
                    >
                        <CloseIcon fontSize="large" />
                    </IconButton>
                </div>
                <DataCardView
                    data={dataRows}
                    onSelect={(card) => {
                        onText(card.url, card.title, card.mime);
                    }}
                />
            </DialogContent>
        </Dialog>
    );
}
