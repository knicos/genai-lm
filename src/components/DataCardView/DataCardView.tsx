import Downloader from '../../utilities/downloader';
import { DataCardItem } from '../DataCard/type';
import DataCardRow, { DataRowSet } from '../DataCardRow/DataCardRow';
import style from './style.module.css';

interface Props {
    selectedSet?: Set<string>;
    data: DataRowSet[];
    onSelect: (card: DataCardItem, downloader: Downloader) => void;
}

export default function DataCardView({ data, onSelect, selectedSet }: Props) {
    return (
        <ul className={style.dataCardView}>
            {data.map((row) => (
                <li key={row.title}>
                    <DataCardRow
                        {...row}
                        onSelect={onSelect}
                        selectedSet={selectedSet}
                    />
                </li>
            ))}
        </ul>
    );
}
