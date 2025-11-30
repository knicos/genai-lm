import { ITokeniser } from '@genai-fi/nanogpt';
import { useEffect, useRef, useState } from 'react';
import style from './sample.module.css';
import { COLORS } from '../../components/TextHighlighter/TextHighlighter';

interface Props {
    sampleTokens: number[];
    tokeniser: ITokeniser;
    selectedTokenIndex: number;
    attention: number[] | null;
}

export default function SampleBox({ sampleTokens, tokeniser, selectedTokenIndex, attention }: Props) {
    const [preText, setPreText] = useState<string>('');
    const [postText, setPostText] = useState<string>('');
    const [tokenText, setTokenText] = useState<string>('');
    const selectedRef = useRef<HTMLSpanElement>(null);
    const tokenBoxRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const tokensBefore = sampleTokens.slice(0, selectedTokenIndex);
        const tokensAfter = sampleTokens.slice(selectedTokenIndex + 1);
        const token = sampleTokens[selectedTokenIndex];

        const decodeTexts = async () => {
            const pre = await tokeniser.decode(tokensBefore);
            const post = await tokeniser.decode(tokensAfter);
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
    }, [preText, postText, tokenText]);

    const vocab = tokeniser.getVocab();

    return (
        <>
            <div
                className={style.sampleBox}
                style={{ borderTopLeftRadius: 10, borderTopRightRadius: 10 }}
            >
                <span>{preText}</span>
                <span
                    ref={selectedRef}
                    className={style.selected}
                >
                    {tokenText}
                </span>
                <span className={style.postText}>{postText}</span>
            </div>
            <div
                className={style.sampleBox}
                ref={tokenBoxRef}
            >
                {sampleTokens.slice(0, selectedTokenIndex).map((token, ix) => (
                    <div
                        key={ix}
                        className={style.token}
                        style={{
                            backgroundColor: COLORS[ix % COLORS.length],
                            opacity: attention ? 0.2 + (attention[ix] || 0) * 0.8 : 1,
                        }}
                    >
                        <span>{vocab[token] || ''}</span>
                        <span className={style.tokenNumber}>{token}</span>
                    </div>
                ))}
            </div>
        </>
    );
}
