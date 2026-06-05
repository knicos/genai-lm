import { IconButton, LinearProgress } from '@mui/material';
import Downloader from '../../utilities/downloader';
import style from './style.module.css';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import CancelIcon from '@mui/icons-material/Cancel';

interface Props {
    downloads: Downloader[] | Downloader;
}

export default function DownloadProgress({ downloads }: Props) {
    const { t } = useTranslation();
    const [total, setTotal] = useState(0);
    const [loaded, setLoaded] = useState(0);

    useEffect(() => {
        const updateProgress = () => {
            const total = Array.isArray(downloads) ? downloads.reduce((acc, d) => acc + d.total, 0) : downloads.total;
            const loaded = Array.isArray(downloads)
                ? downloads.reduce((acc, d) => acc + d.loaded, 0)
                : downloads.loaded;
            setTotal(total);
            setLoaded(loaded);
        };

        updateProgress();

        (Array.isArray(downloads) ? downloads : [downloads]).forEach((downloader) => {
            downloader.on('progress', updateProgress);
            downloader.on('end', updateProgress);
            downloader.on('error', updateProgress);
            downloader.on('cancel', updateProgress);
        });

        return () => {
            (Array.isArray(downloads) ? downloads : [downloads]).forEach((downloader) => {
                downloader.off('progress', updateProgress);
                downloader.off('end', updateProgress);
                downloader.off('error', updateProgress);
                downloader.off('cancel', updateProgress);
            });
        };
    }, [downloads]);

    if (Array.isArray(downloads) && downloads.length === 0) return null;
    if (!Array.isArray(downloads) && !downloads) return null;

    return (
        <div className={style.downloadProgress}>
            <div>
                {t('data.downloading', { count: Array.isArray(downloads) ? downloads.length : 1 })}
                <LinearProgress
                    sx={{ width: '100%' }}
                    variant="determinate"
                    value={total > 0 ? (loaded / total) * 100 : 0}
                    data-testid="progress-bar"
                />
            </div>
            <IconButton
                aria-label={t('data.cancelDownloads')}
                size="small"
                onClick={() => {
                    (Array.isArray(downloads) ? downloads : [downloads]).forEach((download) => download.cancel());
                }}
            >
                <CancelIcon fontSize="small" />
            </IconButton>
        </div>
    );
}
