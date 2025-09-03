import { IconButton, List, ListItem, ListItemAvatar, ListItemText } from '@mui/material';
import style from './DataListing.module.css';
import prettyNumber from '../../utilities/prettyNumber';
import DeleteIcon from '@mui/icons-material/Delete';

export interface DataEntry {
    name: string;
    content: string[];
    size: number;
}

interface Props {
    data: DataEntry[];
    onDelete: (index: number) => void;
}

export default function DataListing({ data, onDelete }: Props) {
    return (
        <List style={{ width: '100%', maxHeight: '300px', overflowY: 'auto' }}>
            {data.map((entry, index) => (
                <ListItem
                    key={index}
                    className={style.item}
                    secondaryAction={
                        <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => {
                                onDelete(index);
                            }}
                        >
                            <DeleteIcon />
                        </IconButton>
                    }
                >
                    <ListItemAvatar>
                        <div className={style.size}>{prettyNumber(entry.size)}</div>
                    </ListItemAvatar>
                    <ListItemText
                        primary={entry.name}
                        secondary={entry.content[0].slice(0, 30) + (entry.content[0].length > 30 ? '...' : '')}
                    />
                </ListItem>
            ))}
        </List>
    );
}
