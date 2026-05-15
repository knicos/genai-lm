import { ITokeniser } from '@genai-fi/nanogpt';
import { useEffect, useRef, useState } from 'react';
import style from './sample.module.css';
import { Help } from '@genai-fi/base';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';

interface Props {
    sampleTokens: number[];
    tokeniser: ITokeniser;
    attention: number[] | null;
    selectedTokenIndex?: number;
    showTokens?: boolean;
    showAnswer?: boolean;
}

export default function SampleBox({
    sampleTokens,
    tokeniser,
    attention,
    selectedTokenIndex,
    showTokens,
    showAnswer,
}: Props) {
    const { t } = useTranslation();
    const [preText, setPreText] = useState<string>('');
    const [postText, setPostText] = useState<string | null>(null);
    const [tokenText, setTokenText] = useState<string | null>(null);
    const selectedRef = useRef<HTMLSpanElement>(null);
    const tokenBoxRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (selectedTokenIndex === undefined) {
            const pre = tokeniser.decode(sampleTokens);
            setPreText(pre);
        } else {
            const tokensBefore = sampleTokens.slice(0, selectedTokenIndex);
            const tokensAfter = sampleTokens.slice(selectedTokenIndex + 1);
            const token = sampleTokens[selectedTokenIndex];

            const pre = tokeniser.decode(tokensBefore);
            const post = tokeniser.decode(tokensAfter).slice(0, 10);
            const tokenStr = tokeniser.getVocab()[token] || '';

            setPreText(pre);
            setPostText(post);
            setTokenText(tokenStr);
        }
    }, [sampleTokens, tokeniser, selectedTokenIndex]);

    useEffect(() => {
        if (selectedRef.current) {
            selectedRef.current.scrollIntoView({ behavior: 'smooth', inline: 'center' });
        }
        if (tokenBoxRef.current) {
            tokenBoxRef.current.scroll(tokenBoxRef.current.scrollWidth, 0);
        }
    }, [preText, postText, tokenText]);

    const vocab = tokeniser.getVocab();

    const slicedTokens = selectedTokenIndex !== undefined ? sampleTokens.slice(0, selectedTokenIndex) : sampleTokens;

    return (
        <Help
            message={t('training.attentionHelp')}
            inplace
            placement="left"
            dark
        >
            <div
                className={style.sampleBox}
                style={{ borderTopLeftRadius: 10, borderTopRightRadius: 10, paddingRight: '2rem' }}
                ref={tokenBoxRef}
            >
                {showTokens &&
                    slicedTokens.map((token, ix) => (
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
                    className={style.selected}
                    style={{ padding: '0 1rem' }}
                >
                    {showAnswer && tokenText ? tokenText : ' '}
                </span>
                {postText && <span className={showAnswer ? style.text : style.postText}>{postText}</span>}
            </div>
        </Help>
    );
}
