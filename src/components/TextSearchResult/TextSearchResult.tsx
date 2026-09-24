import { PrettyResult } from '../../utilities/search/prettyResult';
import { HIGHLIGHT_COLOURS } from '../../components/ConversationDisplay/TokenRender';
import { PercentageBar } from '@genai-fi/base';
import style from './style.module.css';

interface Props {
    result: PrettyResult;
}

export default function TextSearchResult({ result }: Props) {
    return (
        <li className={style.resultItem}>
            <div className={style.resultText}>
                {result.prefixFragments.map((fragment, j) => (
                    <span
                        key={j}
                        className={fragment.match ? style.highlightedNoBorder : ''}
                        style={
                            fragment.match
                                ? ({ '--highlight-color': HIGHLIGHT_COLOURS.green } as React.CSSProperties)
                                : undefined
                        }
                    >
                        {fragment.text}
                    </span>
                ))}
                <span
                    className={style.highlighted}
                    style={{ '--highlight-color': HIGHLIGHT_COLOURS.purple } as React.CSSProperties}
                >
                    {result.text}
                </span>
                {result.suffixFragments.map((fragment, j) => (
                    <span
                        key={j}
                        className={fragment.match ? style.highlightedNoBorder : ''}
                        style={
                            fragment.match
                                ? ({ '--highlight-color': HIGHLIGHT_COLOURS.green } as React.CSSProperties)
                                : undefined
                        }
                    >
                        {fragment.text}
                    </span>
                ))}
            </div>
            <div className={style.infoRow}>
                <div style={{ flexGrow: 1, width: '100%' }} />
                <PercentageBar
                    style={{ fontSize: '0.8rem', height: '1.2rem', minWidth: '100px', width: 'unset' }}
                    colour="blue"
                    value={result.percentage * 100}
                />
            </div>
        </li>
    );
}
