import style from './annotation.module.css';
import ApartmentIcon from '@mui/icons-material/Apartment';
import DatasetIcon from '@mui/icons-material/Dataset';
import { useAtomValue } from 'jotai';
import { trainingAnimation } from '../../state/animations';

interface Props {
    label: string;
    type: 'model' | 'data';
    animate?: boolean;
}

export default function Annotation({ label, type, animate = false }: Props) {
    const anim = useAtomValue(trainingAnimation);

    return (
        <div className={`${style.annotation} ${anim && animate ? style.busy : style.active}`}>
            {type === 'model' ? <ApartmentIcon fontSize="small" /> : <DatasetIcon fontSize="small" />}
            <strong>{label}</strong>
        </div>
    );
}
