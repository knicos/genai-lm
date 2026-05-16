import styleM from './style.module.css';
import prettyNumber from '../../utilities/prettyNumber';
import { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
    value: number;
    label: string;
    style?: CSSProperties;
    unit?: string;
    flip?: boolean;
    fixed?: number;
}

export default function NumberBox({ value, label, style, unit, flip, fixed }: Props) {
    const { t } = useTranslation();
    return (
        <div
            className={styleM.container}
            style={style}
        >
            {flip && <div className={styleM.label}>{label}</div>}
            <div className={styleM.size}>
                {unit ? `${fixed ? value.toFixed(fixed) : value} ${unit}` : prettyNumber(value, t)}
            </div>
            {!flip && <div className={styleM.label}>{label}</div>}
        </div>
    );
}
