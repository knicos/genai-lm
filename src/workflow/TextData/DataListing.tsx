import { IconButton, List, ListItem, ListItemAvatar, ListItemButton, ListItemText } from '@mui/material';
import style from './DataListing.module.css';
import CloseIcon from '@mui/icons-material/Close';
import { MouseEvent } from 'react';
import { DataEntry } from '../../state/data';
import DescriptionIcon from '@mui/icons-material/Description';
import InfoPanel from './InfoPanel';
import { useTranslation } from 'react-i18next';

interface Props {
    data: DataEntry[];
    onDelete: (index: number) => void;
    selected?: number;
    setSelected?: (index: number) => void;
}

export default function DataListing({ data, onDelete, selected, setSelected }: Props) {
    const { t } = useTranslation();
    return (
        <List style={{ width: '100%', flex: '0 1 300px', overflowY: 'auto', boxSizing: 'border-box' }}>
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
                            <DescriptionIcon fontSize="large" />
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
            {data.length === 0 && (
                <ListItem>
                    <InfoPanel
                        show={data.length === 0}
                        severity="info"
                        message={t('data.dataHint')}
                    />
                </ListItem>
            )}
        </List>
    );
}
