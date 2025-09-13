import style from './annotation.module.css';
import ApartmentIcon from '@mui/icons-material/Apartment';
import DatasetIcon from '@mui/icons-material/Dataset';

interface Props {
    label: string;
    type: 'model' | 'data';
}

export default function Annotation({ label, type }: Props) {
    return (
        <div className={style.annotation}>
            {type === 'model' ? <ApartmentIcon fontSize="small" /> : <DatasetIcon fontSize="small" />}
            <strong>{label}</strong>
        </div>
    );
}
