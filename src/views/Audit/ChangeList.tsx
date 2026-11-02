import { PercentageBar } from '@genai-fi/base';
import { ExtendedGeneratorConversation } from '../../state/generator';
import { Changes } from './utilities';
import style from './changelist.module.css';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';

interface Props {
    changes: Changes[];
    conversation: ExtendedGeneratorConversation[];
    conversationIndex: number;
    snippetSize: number;
    onSelect?: (change: Changes) => void;
}

export default function ChangeList({ changes, conversation, conversationIndex, snippetSize, onSelect }: Props) {
    const output = conversation[conversationIndex]?._output;

    if (!output || changes.length === 0 || output.length === 0 || conversationIndex >= conversation.length) {
        return null;
    }

    return (
        <ul className={style.list}>
            {changes.map((change) => {
                const snippetStart = Math.max(0, change.tokenIndex - snippetSize);
                const snippetEnd = Math.min(output.length, change.tokenIndex + snippetSize);
                const snippetBefore = output.slice(snippetStart, change.tokenIndex);
                const snippetAfter = output.slice(change.tokenIndex + 1, snippetEnd);
                const item = output[change.tokenIndex];
                if (!item) return null;
                return (
                    <li
                        key={change.tokenIndex}
                        onClick={() => onSelect?.(change)}
                        onPointerEnter={() => onSelect?.(change)}
                    >
                        {change.change > 0 ? <ArrowUpwardIcon color="success" /> : <ArrowDownwardIcon color="error" />}
                        <PercentageBar
                            value={Math.abs(change.change) * 100}
                            colour={change.change < 0 ? 'red' : 'green'}
                            style={{ flexShrink: 0, flexBasis: '80px', fontSize: '0.8rem', height: '1.4rem' }}
                        />
                        <div className={style.listText}>
                            {snippetBefore.map((s) => s.text).join('')}
                            <strong>{item.text}</strong>
                            {snippetAfter.map((s) => s.text).join('')}
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
