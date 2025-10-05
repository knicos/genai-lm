import { DataCardItem } from '../DataCard/DataCard';
import DataCardRow, { DataRowSet } from '../DataCardRow/DataCardRow';
import style from './style.module.css';

interface Props {
    data: DataRowSet[];
    onSelect: (card: DataCardItem) => void;
}

export default function DataCardView({ data, onSelect }: Props) {
    return (
        <ul className={style.dataCardView}>
            {data.map((row) => (
                <li key={row.title}>
                    <DataCardRow
                        {...row}
                        onSelect={onSelect}
                    />
                </li>
            ))}
        </ul>
    );
}
