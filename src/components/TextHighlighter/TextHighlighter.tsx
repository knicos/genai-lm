import { useEffect, useState } from 'react';
import style from './style.module.css';

interface TokenItem {
    text: string;
    color: string;
}

interface Props {
    text: string;
    onChange?: (text: string) => void;
    mode?: 'plain' | 'tokens' | 'probability';
    initialText?: string;
    probabilities?: number[];
    selected?: number;
    onSelectToken?: (token: string, index: number) => void;
}

const COLORS = ['#FBC6C6', '#C6FBCC', '#C6C8FB', '#FBC6FB', '#C6FBF2', '#F2C6FB', '#FBEDC6'];

function adjustProbability(probability: number, min: number): number {
    return probability < 0.01 ? 0 : probability * (1 - min) + min;
}

function normProb(probabilities: number[] | undefined): number[] {
    if (!probabilities) return [];
    const max = Math.max(...probabilities);
    return probabilities.map((p) => (max > 0 ? p / max : 0));
}

export default function TextHighlighter({ text, mode, probabilities, onSelectToken, selected }: Props) {
    const [tokens, setTokens] = useState<TokenItem[]>([]);

    useEffect(() => {
        const normalisedProbabilities = normProb(probabilities);
        const tokenized = text.split('');
        //console.log('Tokenized:', tokenized);
        const tokens = tokenized.map((token, ix) => {
            let color = '#ffffff00'; // Default color
            if (selected === ix) {
                color = '#ffeb3b';
            } else if (mode === 'tokens') {
                color = COLORS[ix % COLORS.length];
            } else if (mode === 'probability') {
                const probability = normalisedProbabilities ? normalisedProbabilities[ix] || 0 : 0;
                const adjusted = adjustProbability(probability, 0.1);
                color = `rgba(156, 39, 176, ${adjusted.toFixed(2)})`;
            }
            return { text: token, color };
        });

        setTokens(tokens);
    }, [text, mode, probabilities, selected]);

    return (
        <div className={style.outerContainer}>
            <div
                className={style.container}
                onMouseLeave={() => onSelectToken && onSelectToken('', -1)}
            >
                <div className={style.tokens}>
                    {tokens.map((t, id) => (
                        <span
                            onMouseEnter={() => {
                                if (onSelectToken) onSelectToken(t.text, id);
                            }}
                            key={id}
                            style={{ backgroundColor: t.color }}
                        >
                            {t.text}
                        </span>
                    ))}
                    <span className={style.cursor}>_</span>
                </div>
            </div>
        </div>
    );
}
