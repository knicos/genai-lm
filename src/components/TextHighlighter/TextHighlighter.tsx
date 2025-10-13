import { useEffect, useRef, useState } from 'react';
import style from './style.module.css';
import { useTranslation } from 'react-i18next';
import { TeachableLLM } from '@genai-fi/nanogpt';

interface TokenItem {
    text: string;
    color: string;
    opacity: number;
    className?: string;
}

export interface ProbabilityItem {
    index: number;
    probability: number;
}

interface Props {
    text: string;
    onChange?: (text: string) => void;
    mode?: 'edit' | 'plain' | 'tokens' | 'probability';
    initialText?: string;
    probabilities?: ProbabilityItem[];
    selected?: number;
    onSelectToken?: (token: string, index: number) => void;
    active?: boolean;
    tokeniser?: typeof TeachableLLM.prototype.tokeniser;
}

const COLORS = ['#FBC6C6', '#C6FBCC', '#C6C8FB', '#FBC6FB', '#C6FBF2', '#F2C6FB', '#FBEDC6'];

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
    const [locked, setLocked] = useState(false);

    useEffect(() => {
        if (mode === 'edit' || mode === 'plain' || !probabilities || !tokeniser) {
            return;
        }

        tokeniser.tokenise([text], false).then((tokenArray) => {
            const tokenized = tokenArray[0] as string[];
            //console.log('Tokenized:', tokenized);
            const tokens = tokenized.map((token, ix) => {
                let color = '#ffffff00'; // Default color
                let opacity = 1;
                let className: string | undefined = undefined;
                if (selected === ix) {
                    //color = '#9b8c07ff';
                    className = style.selected;
                } else if (mode === 'tokens') {
                    color = COLORS[ix % COLORS.length];
                } else if (mode === 'probability') {
                    const probability = probabilities ? probabilities[ix] : { index: -1, probability: 0 };

                    if (!probability) {
                        return { text: token, color, opacity };
                    }

                    const adjusted = probability?.probability || 0;
                    //color = `rgba(156, 39, 176, ${adjusted.toFixed(2)})`;
                    if (adjusted > 0.2) {
                        color = COLORS[probability.index % COLORS.length];
                    }
                    opacity = Math.max(0.2, adjusted);
                }
                return { text: token, color, opacity, className };
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
                onMouseLeave={() => onSelectToken && !locked && onSelectToken('', -1)}
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
                                    if (onSelectToken && !locked) onSelectToken(t.text, id);
                                }}
                                onClick={() => {
                                    if (selected === id) setLocked((old) => !old);
                                    if (onSelectToken) onSelectToken(t.text, id);
                                }}
                                key={id}
                                style={t.className ? undefined : { backgroundColor: t.color, opacity: t.opacity }}
                                className={t.className}
                            >
                                {t.text}
                            </span>
                        ))}
                    {mode === 'plain' && text}
                    {mode === 'edit' && (
                        <textarea
                            ref={textRef}
                            className={style.editable}
                            data-testid="input-box"
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
                            data-testid="cursor"
                        ></div>
                    )}
                </div>
            </div>
        </div>
    );
}
