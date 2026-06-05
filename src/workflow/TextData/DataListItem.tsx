import { IconButton, ListItem, ListItemAvatar, ListItemButton, ListItemText } from '@mui/material';
import { DataEntry } from '../../state/data';
import CloseIcon from '@mui/icons-material/Close';
import DescriptionIcon from '@mui/icons-material/Description';
import ErrorIcon from '@mui/icons-material/Error';
import { MouseEvent } from 'react';
import style from './DataListing.module.css';
import DownloadProgress from '../../components/DownloadProgress/DownloadProgress';
import { Button } from '@genai-fi/base';
import useDataEntryStatus from '../../hooks/useDataEntryStatus';
import { useTranslation } from 'react-i18next';

interface Props {
    index: number;
    selected: number;
    setSelected?: (index: number) => void;
    onDelete: (index: number) => void;
    entry: DataEntry;
}

export default function DataListItem({ index, selected, setSelected, onDelete, entry }: Props) {
    const { t } = useTranslation();
    useDataEntryStatus(entry);
    const needsLoading = !entry.hasLoaded && entry.canLoad && !entry.isLoading;
    const isDownloading = entry.downloader !== null && entry.downloader.downloading && !entry.hasLoaded;

    return (
        <ListItem
            key={index}
            className={style.item}
        >
            <ListItemButton
                selected={index === selected}
                onClick={() => {
                    if (needsLoading) {
                        entry.load().then(() => {
                            if (setSelected) {
                                setSelected(index);
                            }
                        });
                    } else {
                        if (setSelected) {
                            setSelected(index);
                        }
                    }
                }}
            >
                <ListItemAvatar className={style.avatar}>
                    <DescriptionIcon fontSize="large" />
                </ListItemAvatar>
                <ListItemText primary={entry.name} />
                {isDownloading && <DownloadProgress downloads={[entry.downloader]} />}
                {needsLoading && (
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            entry.load();
                        }}
                    >
                        {t('data.load')}
                    </Button>
                )}
                {entry.invalid && (
                    <div className={style.error}>
                        <ErrorIcon color="error" />
                        <span>{t(entry.source === 'file' ? 'data.missingFile' : 'data.missingData')}</span>
                    </div>
                )}

                <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={(e: MouseEvent) => {
                        e.stopPropagation();
                        onDelete(index);
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </ListItemButton>
        </ListItem>
    );
}
