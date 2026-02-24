import ChatClientProtocol from './ChatClientProtocol';
import { useState } from 'react';
import { Conversation } from '@genai-fi/nanogpt';
import ConversationDisplay from '../../components/ConversationDisplay/ConversationDisplay';
import style from './style.module.css';
import ChatPromptInput from '../../components/ChatPromptInput/ChatPromptInput';
import { useTranslation } from 'react-i18next';
import { usePeerSender } from '@genai-fi/base/hooks/peer';
import { EventProtocol } from '../../components/PeerShare/events';

export default function Page() {
    const { t } = useTranslation();
    const [conversation, setConversation] = useState<Conversation[]>([]);
    const [busy, setBusy] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);
    const send = usePeerSender<EventProtocol>();
    const [conversationId, setConversationId] = useState<string | null>(null);

    return (
        <>
            <ChatClientProtocol
                conversation={conversation}
                onIdChange={setConversationId}
                onResponse={(response, completed) => {
                    setConversation((prev) => {
                        const isAssistant = prev.length > 0 && prev[prev.length - 1].role === 'assistant';
                        const next: Conversation[] = isAssistant
                            ? [...prev]
                            : [...prev, { role: 'assistant', content: '' }];
                        const last = next[next.length - 1];
                        last.content = response;
                        return next;
                    });
                    if (completed) {
                        setBusy(false);
                    }
                }}
            />
            <section>
                <div className={style.conversationBox}>
                    <ConversationDisplay conversation={conversation} />
                </div>
            </section>
            <div className={`${style.prompt} ${!hasGenerated ? style.start : ''}`}>
                {!hasGenerated && <h1>{t('deploy.welcome_message')}</h1>}
                <ChatPromptInput
                    onSend={(prompt: string) => {
                        if (prompt) {
                            setBusy(true);
                            setConversation([...conversation, { role: 'user', content: prompt }]);
                            setHasGenerated(true);
                        }
                    }}
                    onStop={() => {
                        if (conversationId) {
                            send({ event: 'stop', conversation: conversationId });
                        }
                    }}
                    generating={busy}
                    placeholder={t('deploy.placeholder')}
                />
            </div>
        </>
    );
}
