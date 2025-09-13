import { useEffect, useState } from 'react';
import style from './style.module.css';
import { Button } from '@genai-fi/base';
import { useTranslation } from 'react-i18next';
import { List, ListItemButton } from '@mui/material';

interface DataManifestEntry {
    title: string;
    url: string;
    mime: string;
    size: number;
    lang: string;
}

interface Props {
    onText: (text: string, name: string, type: string) => void;
    onClose: () => void;
}

export default function TextSearch({ onText, onClose }: Props) {
    const { t } = useTranslation();
    const [manifest, setManifest] = useState<DataManifestEntry[]>([]);

    useEffect(() => {
        fetch('/dataManifest.json')
            .then((res) => res.json())
            .then((data) => setManifest(data))
            .catch(() => setManifest([]));
    }, []);

    return (
        <div className={style.textInputContainer}>
            <List style={{ overflowY: 'auto', width: '100%' }}>
                {manifest.map((entry) => (
                    <ListItemButton
                        key={entry.url}
                        onClick={() => {
                            onText(entry.url, entry.title, entry.mime);
                        }}
                    >
                        {entry.title}
                    </ListItemButton>
                ))}
            </List>
            <div className={style.buttonRow}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                >
                    {t('data.cancel')}
                </Button>
            </div>
        </div>
    );
}
