import { IconButton, List, ListItem, ListItemAvatar, ListItemButton, ListItemText } from '@mui/material';
import style from './DataListing.module.css';
import prettyNumber from '../../utilities/prettyNumber';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import { MouseEvent } from 'react';

export interface DataEntry {
    id: string;
    name: string;
    content: string[];
    size: number;
    source: 'file' | 'input' | 'search';
}

interface Props {
    data: DataEntry[];
    onDelete: (index: number) => void;
    selected?: number;
    setSelected?: (index: number) => void;
}

export default function DataListing({ data, onDelete, selected, setSelected }: Props) {
    const { t } = useTranslation();
    return (
        <List style={{ width: '100%', maxHeight: '300px', overflowY: 'auto', boxSizing: 'border-box' }}>
            {data.map((entry, index) => (
                <ListItem
                    key={index}
                    className={style.item}
                >
                    <ListItemButton
                        selected={index === selected}
                        onClick={() => setSelected && setSelected(index)}
                    >
                        <ListItemAvatar className={style.avatar}>
                            <div className={style.size}>{prettyNumber(entry.size)}</div>
                            <div className={style.label}>{t('data.samples')}</div>
                        </ListItemAvatar>
                        <ListItemText primary={entry.name} />
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
            ))}
        </List>
    );
}
