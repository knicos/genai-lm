import { ITokeniser } from '@genai-fi/nanogpt';
import { useEffect, useRef, useState } from 'react';
import style from './sample.module.css';
import { Help } from '@genai-fi/base';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';

interface Props {
    sampleTokens: number[];
    tokeniser: ITokeniser;
    selectedTokenIndex: number;
    attention: number[] | null;
    showTokens?: boolean;
    showAnswer?: boolean;
    isCorrect?: boolean;
}

export default function SampleBox({
    sampleTokens,
    tokeniser,
    selectedTokenIndex,
    attention,
    showTokens,
    showAnswer,
    isCorrect,
}: Props) {
    const { t } = useTranslation();
    const [preText, setPreText] = useState<string>('');
    const [postText, setPostText] = useState<string>('');
    const [tokenText, setTokenText] = useState<string>('');
    const selectedRef = useRef<HTMLSpanElement>(null);
    const tokenBoxRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const tokensBefore = sampleTokens.slice(0, selectedTokenIndex);
        const tokensAfter = sampleTokens.slice(selectedTokenIndex + 1);
        const token = sampleTokens[selectedTokenIndex];

        const decodeTexts = () => {
            const pre = tokeniser.decode(tokensBefore);
            const post = tokeniser.decode(tokensAfter).slice(0, 10);
            const tokenStr = tokeniser.getVocab()[token] || '';

            setPreText(pre);
            setPostText(post);
            setTokenText(tokenStr);
        };

        decodeTexts();
    }, [sampleTokens, selectedTokenIndex, tokeniser]);

    useEffect(() => {
        if (selectedRef.current) {
            selectedRef.current.scrollIntoView({ behavior: 'smooth', inline: 'center' });
        }
        if (tokenBoxRef.current) {
            tokenBoxRef.current.scroll(tokenBoxRef.current.scrollWidth, 0);
        }
    }, [preText, postText, tokenText, showTokens]);

    const vocab = tokeniser.getVocab();

    return (
        <Help
            message={t('training.attentionHelp')}
            inplace
            placement="left"
            dark
        >
            <div
                className={style.sampleBox}
                style={{ borderTopLeftRadius: 10, borderTopRightRadius: 10 }}
                ref={tokenBoxRef}
            >
                {showTokens &&
                    sampleTokens.slice(0, selectedTokenIndex).map((token, ix) => (
                        <span
                            key={ix}
                            className={style.token}
                            style={{
                                borderColor: theme.light.chartColours[token % theme.light.chartColours.length],
                                opacity: attention ? 0.2 + (attention[ix] || 0) * 0.8 : 1,
                            }}
                        >
                            {vocab[token] || ''}
                        </span>
                    ))}
                {!showTokens && <span>{preText}</span>}
                <span
                    ref={selectedRef}
                    className={`${style.selected} ${isCorrect ? style.correct : showAnswer ? style.incorrect : ''}`}
                    style={!showAnswer ? { padding: '0 1rem' } : undefined}
                >
                    {showAnswer ? tokenText : ' '}
                </span>
                <span className={showAnswer ? style.text : style.postText}>{postText}</span>
            </div>
        </Help>
    );
}
