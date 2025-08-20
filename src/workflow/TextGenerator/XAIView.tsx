import style from './style.module.css';
import TokenProbability from './TokenProbability';

interface Props {
    probabilities: { token: string; probability: number }[];
}

export default function XAIView({ probabilities }: Props) {
    return probabilities.length > 0 ? (
        <div className={style.xaiContainer}>
            <ul>
                {probabilities.map(({ token, probability }) => (
                    <TokenProbability
                        key={token}
                        token={token}
                        probability={probability}
                    />
                ))}
            </ul>
        </div>
    ) : null;
}
