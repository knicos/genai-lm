import { useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import ConversationDisplay from '../../components/ConversationDisplay/ConversationDisplay';
import style from './style.module.css';
import { useAtomValue } from 'jotai';
import { conversationGeneratedAtom } from '../../state/generator';
import { loadedModelAtom } from '../../state/model';
import ChatMenu from './ChatMenu';
import { useNavigate } from 'react-router';

export default function ChatConversation() {
    const model = useAtomValue(loadedModelAtom);
    const [output, setOutput] = useAtom(conversationGeneratedAtom);
    const navigate = useNavigate();
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (model) {
            setOutput([]);
        }
    }, [model, setOutput]);

    return (
        <div
            className={style.container}
            data-widget="chat-output"
            data-testid="conversation-output"
            ref={ref}
        >
            <ChatMenu
                onReset={() => {
                    setOutput([]);
                }}
                onShowSettings={() => {
                    navigate('generator-settings');
                }}
            />
            <ConversationDisplay conversation={output} />
        </div>
    );
}
