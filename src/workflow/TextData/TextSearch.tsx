import { Suspense, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogContent,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent,
} from '@mui/material';

import style from './style.module.css';
import CloseIcon from '@mui/icons-material/Close';
import Downloader from '../../utilities/downloader';
import DownloadProgress from '../../components/DownloadProgress/DownloadProgress';
import { Spinner } from '@genai-fi/base';
import { useAtom } from 'jotai';
import { dataManifestLanguage } from '../../state/data';
import TextSearchListing, { SortType } from './TextSearchListing';
import { LANGS } from '../../components/AppBar/langs';

interface Props {
    onDownload(downloader: Downloader): void;
    downloads: Downloader[];
    onClose: () => void;
    selectedSet?: Set<string>;
}

export default function TextSearch({ onDownload, downloads, onClose, selectedSet }: Props) {
    const { t, i18n } = useTranslation();
    const [lang, setLang] = useAtom(dataManifestLanguage);
    const [sort, setSort] = useState<SortType>('smallest');

    const [open, setOpen] = useState(true);

    useEffect(() => {
        setLang(i18n.language.split('-')[0]);
    }, [i18n.language, setLang]);

    useEffect(() => {
        if (!open) {
            const timer = setTimeout(() => {
                onClose();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [open, onClose]);

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
                    {downloads.length === 0 && (
                        <FormControl size="small">
                            <Select
                                aria-label={t('data.language')}
                                value={lang}
                                onChange={(e: SelectChangeEvent) => setLang(e.target.value)}
                            >
                                {LANGS.map((l) => (
                                    <MenuItem
                                        key={l.name}
                                        value={l.name.split('-')[0]}
                                    >
                                        {l.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                    <DownloadProgress downloads={downloads} />
                    <FormControl
                        size="small"
                        sx={{ marginLeft: 2, minWidth: 120 }}
                    >
                        <InputLabel htmlFor="sort-select">{t('data.sort')}</InputLabel>
                        <Select
                            id="sort-select"
                            aria-label={t('data.sort')}
                            value={sort}
                            label={t('data.sort')}
                            onChange={(e: SelectChangeEvent) => setSort(e.target.value as SortType)}
                        >
                            <MenuItem value={'smallest'}>{t('data.sortSmallest')}</MenuItem>
                            <MenuItem value={'largest'}>{t('data.sortLargest')}</MenuItem>
                            <MenuItem value={'simple'}>{t('data.sortSimple')}</MenuItem>
                            <MenuItem value={'complex'}>{t('data.sortComplex')}</MenuItem>
                        </Select>
                    </FormControl>
                    <div style={{ flexGrow: 1 }} />
                    <IconButton
                        onClick={() => setOpen(false)}
                        aria-label={t('data.close')}
                    >
                        <CloseIcon fontSize="large" />
                    </IconButton>
                </div>
                <Suspense
                    fallback={
                        <div className={style.spinner}>
                            <Spinner />
                        </div>
                    }
                >
                    <TextSearchListing
                        onDownload={onDownload}
                        selectedSet={selectedSet}
                        sort={sort}
                    />
                </Suspense>
            </DialogContent>
        </Dialog>
    );
}
