import { useTranslation } from 'react-i18next';
import Box from '../../components/BoxTitle/Box';
import style from './style.module.css';
import InstructMenu from './InstructMenu';
import { useEffect, useRef, useState } from 'react';
import { useAtom } from 'jotai';
import { conversationDataAtom } from '../../state/data';
import ConversationList from './ConversationList';
import ConversationDisplay from '../../components/ConversationDisplay/ConversationDisplay';
import { Conversation } from '@genai-fi/nanogpt';
import { saveAs } from 'file-saver';
import { useNavigate } from 'react-router-dom';

export default function InstructData() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [conversations, setConversations] = useAtom(conversationDataAtom);
    const [selected, setSelected] = useState<number>(0);
    const fileRef = useRef<HTMLInputElement>(null);
    const disable = false;
    const done = conversations.length > 1;
    const busy = false;

    useEffect(() => {
        setConversations((old) => {
            if (old.length === 0) {
                return [
                    [
                        { role: 'user', content: '' },
                        { role: 'assistant', content: '' },
                    ],
                ];
            }
            return old;
        });
    }, [setConversations]);

    return (
        <Box
            widget="tuneData"
            style={{ minWidth: '350px', display: 'flex', flexDirection: 'column' }}
            active={done}
            disabled={disable}
            fullWidth
        >
            <div className={style.container}>
                <input
                    type="file"
                    accept=".json,.jsonl"
                    ref={fileRef}
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                        if (e.target.files && e.target.files.length > 0) {
                            const file = e.target.files[0];
                            if (file) {
                                const text = await file.text();

                                if (file.name.endsWith('.jsonl')) {
                                    const lines = text.split('\n').filter((line) => line.trim() !== '');
                                    const data: Conversation[][] = [];
                                    for (const line of lines) {
                                        try {
                                            const convo = JSON.parse(line);
                                            if (Array.isArray(convo)) {
                                                data.push(convo);
                                            }
                                        } catch {
                                            // skip invalid lines
                                        }
                                    }
                                    if (data.length > 0) {
                                        setConversations(data);
                                        setSelected(0);
                                    } else {
                                        alert(t('instruct.uploadError'));
                                    }
                                    return;
                                }
                                try {
                                    const data = JSON.parse(text);
                                    if (Array.isArray(data)) {
                                        setConversations(data);
                                        setSelected(0);
                                    } else {
                                        alert(t('instruct.uploadError'));
                                    }
                                } catch {
                                    alert(t('instruct.uploadError'));
                                }
                            }
                        }
                    }}
                />
                <InstructMenu
                    onAutoPrompt={() => navigate('auto-tune')}
                    onDeleteAll={() => setConversations([])}
                    onDownload={() => {
                        saveAs(
                            new Blob([JSON.stringify(conversations, undefined, 4)], { type: 'application/json' }),
                            'conversation.json'
                        );
                    }}
                    onUpload={() => {
                        fileRef.current?.click();
                    }}
                    disabled={disable || busy}
                    onNewConversation={() => {
                        const newConvo: Conversation[][] = [
                            ...conversations,
                            [
                                { role: 'user', content: '' },
                                { role: 'assistant', content: '' },
                            ],
                        ];
                        setConversations(newConvo);
                        setSelected(newConvo.length - 1);
                    }}
                />
                <div className={style.content}>
                    <h3>{t('instruct.conversations', { count: conversations.length })}</h3>
                    <ConversationList
                        data={conversations}
                        onSelect={setSelected}
                        onChange={setConversations}
                    />
                    <div className={style.chatContainer}>
                        <ConversationDisplay
                            conversation={conversations[selected]}
                            editable
                        />
                    </div>
                </div>
            </div>
        </Box>
    );
}
