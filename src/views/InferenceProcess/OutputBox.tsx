import { CSSProperties } from 'react';
import style from './style.module.css';

interface Props {
    selectedToken?: string;
    style?: CSSProperties;
}

export default function OutputBox({ selectedToken, style: customStyle }: Props) {
    return (
        <div
            className={style.outputBox}
            style={customStyle}
        >
            <div className={`${style.outputContent} ${!selectedToken ? style.outputPlaceholder : ''}`}>
                <span className={style.tokenOut}>{selectedToken}</span>
            </div>
        </div>
    );
}
