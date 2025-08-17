import style from './style.module.css';

interface Props {
    token: string;
    probability: number;
}

export default function TokenProbability({ token, probability }: Props) {
    return (
        <li>
            <div className={style.probDetails}>
                <span>{token}</span> <span>{(probability * 100).toFixed(0)}%</span>
            </div>
            <div
                className={style.probBar}
                style={{ width: `${(probability * 100).toFixed(0)}%` }}
            />
        </li>
    );
}
