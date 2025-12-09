import { IconButton, LinearProgress } from '@mui/material';
import Downloader from '../../utilities/downloader';
import style from './style.module.css';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import CancelIcon from '@mui/icons-material/Cancel';

interface Props {
    downloads: Downloader[];
}

export default function DownloadProgress({ downloads }: Props) {
    const { t } = useTranslation();
    const [total, setTotal] = useState(0);
    const [loaded, setLoaded] = useState(0);

    useEffect(() => {
        const updateProgress = () => {
            const total = downloads.reduce((acc, d) => acc + d.total, 0);
            const loaded = downloads.reduce((acc, d) => acc + d.loaded, 0);
            setTotal(total);
            setLoaded(loaded);
        };

        updateProgress();

        downloads.forEach((downloader) => {
            downloader.on('progress', updateProgress);
            downloader.on('end', updateProgress);
            downloader.on('error', updateProgress);
            downloader.on('cancel', updateProgress);
        });

        return () => {
            downloads.forEach((downloader) => {
                downloader.off('progress', updateProgress);
                downloader.off('end', updateProgress);
                downloader.off('error', updateProgress);
                downloader.off('cancel', updateProgress);
            });
        };
    }, [downloads]);

    if (downloads.length === 0) return null;

    return (
        <div className={style.downloadProgress}>
            <div>
                {t('data.downloading', { count: downloads.length })}
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
                    downloads.forEach((download) => download.cancel());
                }}
            >
                <CancelIcon fontSize="small" />
            </IconButton>
        </div>
    );
}
