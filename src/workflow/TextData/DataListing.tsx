import { List, ListItem } from '@mui/material';
import { DataEntry } from '../../state/data';
import InfoPanel from './InfoPanel';
import { useTranslation } from 'react-i18next';
import DataListItem from './DataListItem';

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
                <DataListItem
                    entry={entry}
                    index={index}
                    key={entry.id}
                    onDelete={onDelete}
                    selected={selected ?? -1}
                    setSelected={setSelected}
                />
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
