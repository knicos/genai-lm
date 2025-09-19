import { useEffect, useRef, useState } from 'react';
import style from './style.module.css';
import { useTranslation } from 'react-i18next';
import { TeachableLLM } from '@genai-fi/nanogpt';

interface TokenItem {
    text: string;
    color: string;
}

interface Props {
    text: string;
    onChange?: (text: string) => void;
    mode?: 'edit' | 'plain' | 'tokens' | 'probability';
    initialText?: string;
    probabilities?: number[];
    selected?: number;
    onSelectToken?: (token: string, index: number) => void;
    active?: boolean;
    tokeniser?: typeof TeachableLLM.prototype.tokeniser;
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

export default function TextHighlighter({
    text,
    mode,
    probabilities,
    onSelectToken,
    selected,
    active,
    onChange,
    tokeniser,
}: Props) {
    const { t } = useTranslation();
    const cursorRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLTextAreaElement>(null);
    const [tokens, setTokens] = useState<TokenItem[]>([]);

    useEffect(() => {
        if (mode === 'edit' || mode === 'plain' || !probabilities || !tokeniser) {
            return;
        }
        const normalisedProbabilities = normProb(probabilities);
        tokeniser.tokenise([text], false).then((tokenArray) => {
            const tokenized = tokenArray[0] as string[];
            //console.log('Tokenized:', tokenized);
            const tokens = tokenized.map((token, ix) => {
                let color = '#ffffff00'; // Default color
                if (selected === ix) {
                    color = '#9b8c07ff';
                } else if (mode === 'tokens') {
                    color = COLORS[ix % COLORS.length];
                } else if (mode === 'probability') {
                    const probability = normalisedProbabilities ? normalisedProbabilities[ix] || 0 : 0;
                    const adjusted = adjustProbability(probability, 0.2);
                    color = `rgba(156, 39, 176, ${adjusted.toFixed(2)})`;
                }
                return { text: token, color };
            });

            setTokens(tokens);
        });
    }, [text, mode, probabilities, selected, tokeniser]);

    useEffect(() => {
        if (cursorRef.current) {
            const cursor = cursorRef.current;
            cursor.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
        if (text.length === 0 && textRef.current) {
            textRef.current.value = '';
            textRef.current.style.height = 'auto';
            textRef.current.style.height = textRef.current.scrollHeight + 'px';
            textRef.current.focus();
        }
    }, [text]);

    return (
        <div className={style.outerContainer}>
            <div
                className={style.container}
                onMouseLeave={() => onSelectToken && onSelectToken('', -1)}
            >
                <div
                    className={style.tokens}
                    onClick={() => textRef.current?.focus()}
                >
                    {mode === 'probability' &&
                        probabilities &&
                        tokens.map((t, id) => (
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
                    {mode === 'plain' && text}
                    {mode === 'edit' && (
                        <textarea
                            ref={textRef}
                            className={style.editable}
                            placeholder={t('generator.editPlaceholder')}
                            spellCheck="false"
                            autoComplete="off"
                            onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                if (onChange) onChange(target.value);
                                target.style.height = 'auto';
                                target.style.height = target.scrollHeight + 'px';
                            }}
                        />
                    )}
                    {mode !== 'edit' && (
                        <div
                            className={`${style.cursor} ${active ? style.active : ''}`}
                            ref={cursorRef}
                        ></div>
                    )}
                </div>
            </div>
        </div>
    );
}
