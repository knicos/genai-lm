import { IconButton, List, ListItemAvatar, ListItemButton, ListItemText } from '@mui/material';
import style from './DataListing.module.css';
import prettyNumber from '../../utilities/prettyNumber';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';
import { MouseEvent } from 'react';

export interface DataEntry {
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
        <List style={{ width: '100%', maxHeight: '300px', overflowY: 'auto' }}>
            {data.map((entry, index) => (
                <ListItemButton
                    selected={index === selected}
                    onClick={() => setSelected && setSelected(index)}
                    key={index}
                    className={style.item}
                >
                    <ListItemAvatar style={{ textAlign: 'center' }}>
                        <div className={style.size}>{prettyNumber(entry.size)}</div>
                        <div className={style.label}>{t('data.samples')}</div>
                    </ListItemAvatar>
                    <ListItemText
                        primary={entry.name}
                        secondary={entry.content[0].slice(0, 30) + (entry.content[0].length > 30 ? '...' : '')}
                    />
                    <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={(e: MouseEvent) => {
                            e.stopPropagation();
                            onDelete(index);
                        }}
                    >
                        <DeleteIcon />
                    </IconButton>
                </ListItemButton>
            ))}
        </List>
    );
}
