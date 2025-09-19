import styleM from './style.module.css';
import prettyNumber from '../../utilities/prettyNumber';
import { CSSProperties } from 'react';

interface Props {
    value: number;
    label: string;
    style?: CSSProperties;
    unit?: string;
}

export default function NumberBox({ value, label, style, unit }: Props) {
    return (
        <div
            className={styleM.container}
            style={style}
        >
            <div className={styleM.size}>{unit ? `${value} ${unit}` : prettyNumber(value)}</div>
            <div className={styleM.label}>{label}</div>
        </div>
    );
}
