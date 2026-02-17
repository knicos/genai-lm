import { useParams } from 'react-router-dom';
import { Peer } from '@genai-fi/base/hooks/peer';
import { useAtomValue } from 'jotai';
import { sessionCode } from '../../state/share';
import ChatClientProtocol from './ChatClientProtocol';
import { useState } from 'react';
import { Conversation } from '@genai-fi/nanogpt';
import ConversationDisplay from '../../components/ConversationDisplay/ConversationDisplay';
import { ConnectionStatus } from '@genai-fi/base';
import style from './style.module.css';
import ChatPromptInput from '../../components/ChatPromptInput/ChatPromptInput';
import { useTranslation } from 'react-i18next';

export function Component() {
    const { t } = useTranslation();
    const { code } = useParams();
    const sessionCodeValue = useAtomValue(sessionCode);
    const [conversation, setConversation] = useState<Conversation[]>([]);
    const [busy, setBusy] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);

    return (
        <main className={style.container}>
            <Peer
                host={import.meta.env.VITE_APP_PEER_SERVER}
                secure={import.meta.env.VITE_APP_PEER_SECURE === '1'}
                peerkey={import.meta.env.VITE_APP_PEER_KEY || 'peerjs'}
                port={import.meta.env.VITE_APP_PEER_PORT ? parseInt(import.meta.env.VITE_APP_PEER_PORT) : 443}
                server={`lm-${code}`}
                code={`lm-${sessionCodeValue}`}
            >
                <div className={style.status}>
                    <ConnectionStatus
                        api={import.meta.env.VITE_APP_PEER_URL}
                        checkURL={import.meta.env.VITE_APP_API}
                        appName="lm"
                        visibility={0}
                    />
                </div>
                <ChatClientProtocol
                    conversation={conversation}
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
            </Peer>
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
                        // TODO
                    }}
                    generating={busy}
                    placeholder={t('deploy.placeholder')}
                />
            </div>
        </main>
    );
}
