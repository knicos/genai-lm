import style from './style.module.css';

interface Props {
    selectedToken?: string;
}

export default function OutputBox({ selectedToken }: Props) {
    return (
        <div className={style.outputBox}>
            <div className={`${style.outputContent} ${!selectedToken ? style.outputPlaceholder : ''}`}>
                <span className={style.tokenOut}>{selectedToken}</span>
            </div>
        </div>
    );
}
