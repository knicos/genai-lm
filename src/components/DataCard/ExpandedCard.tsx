import { IconButton } from '@mui/material';
import Downloader from '../../utilities/downloader';
import DownloadIcon from '@mui/icons-material/Download';
import CheckIcon from '@mui/icons-material/Check';
import style from './style.module.css';
import SampleWriter from './SampleWriter';
import { DataCardItem } from './type';

interface Props {
    coords: { top: number; left: number; width: number; height: number } | null;
    toClose: boolean;
    downloader: Downloader | null;
    done: boolean;
    handleClose: () => void;
    onSelect: (card: DataCardItem, downloader: Downloader) => void;
    setDownloader: (downloader: Downloader | null) => void;
    setDone: (done: boolean) => void;
    card: DataCardItem;
}

export default function ExpandedCard({
    coords,
    toClose,
    downloader,
    done,
    handleClose,
    onSelect,
    setDownloader,
    setDone,
    card,
}: Props) {
    const sample = card.sample;

    const handleDownload = () => {
        const downloader = Downloader.downloadFile(card.id, card.url, card.title, card.mime);
        downloader.on('end', () => setDone(true));
        setDownloader(downloader);
        onSelect(card, downloader);
        handleClose();
    };

    return (
        <div
            id={`expanded-card-${card.id}`}
            className={`${style.expandedCard} ${toClose ? style.scaleOut : ''}`}
            style={{
                top: coords?.top,
                left: coords?.left,
                width: coords?.width,
                //height: coords?.height,
            }}
            onMouseLeave={handleClose}
            onClick={handleDownload}
        >
            <div className={`${style.expandedSampleBox} ${style[card.complexity]}`}>
                <SampleWriter sample={sample} />
            </div>
            <div className={style.buttonRow}>
                <h2>{card.title}</h2>
                <div style={{ flexGrow: 1 }} />
                <IconButton
                    color="secondary"
                    disabled={downloader !== null}
                    onClick={handleDownload}
                >
                    {done ? <CheckIcon fontSize="large" /> : <DownloadIcon fontSize="large" />}
                </IconButton>
            </div>
        </div>
    );
}
