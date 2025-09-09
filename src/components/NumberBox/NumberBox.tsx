import styleM from './style.module.css';
import prettyNumber from '../../utilities/prettyNumber';
import { CSSProperties } from 'react';

interface Props {
    value: number;
    label: string;
    style?: CSSProperties;
}

export default function NumberBox({ value, label, style }: Props) {
    return (
        <div
            className={styleM.container}
            style={style}
        >
            <div className={styleM.size}>{prettyNumber(value)}</div>
            <div className={styleM.label}>{label}</div>
        </div>
    );
}
