import { useTranslation } from 'react-i18next';
import Box from '../../components/BoxTitle/Box';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import style from './style.module.css';
import InstructMenu from './InstructMenu';
import { useRef, useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { conversationDataAtom } from '../../state/data';
import ConversationList from './ConversationList';
import { Conversation } from '@genai-fi/nanogpt';
import { saveAs } from 'file-saver';
import { useNavigate } from 'react-router';
import { rawGeneratedTextAtom, rawGenerationIDAtom } from '../../state/generator';
import BoxNotice, { Notice } from '../../components/BoxTitle/BoxNotice';

export default function InstructData() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [conversations, setConversations] = useAtom(conversationDataAtom);
    const setConversation = useSetAtom(rawGeneratedTextAtom);
    const setResponseID = useSetAtom(rawGenerationIDAtom);
    const [, setSelected] = useState<number>(-1);
    const [message, setMessage] = useState<Notice | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const disable = false;
    const done = conversations.length > 1;
    const busy = false;

    return (
        <Box
            widget="tuneData"
            style={{ width: '30rem', display: 'flex', flexDirection: 'column' }}
            active={done}
            disabled={disable}
        >
            <div className={style.container}>
                <BoxTitle
                    title={t('instruct.title')}
                    status={done ? 'done' : 'waiting'}
                />
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
                                        setMessage({
                                            level: 'error',
                                            notice: t('instruct.uploadError'),
                                        });
                                    }
                                    return;
                                }
                                try {
                                    const data = JSON.parse(text);
                                    if (Array.isArray(data)) {
                                        setConversations(data);
                                        setSelected(0);
                                    } else {
                                        setMessage({
                                            level: 'error',
                                            notice: t('instruct.uploadError'),
                                        });
                                    }
                                } catch {
                                    setMessage({
                                        level: 'error',
                                        notice: t('instruct.uploadError'),
                                    });
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
                />
                <div className={style.content}>
                    <h3>{t('instruct.conversations', { count: conversations.length })}</h3>
                    <ConversationList
                        data={conversations}
                        onSelect={(index) => {
                            setSelected(index);
                            if (index >= 0 && index < conversations.length) {
                                setConversation(conversations[index]);
                                setResponseID(null);
                            }
                        }}
                        onChange={setConversations}
                    />
                </div>
                {message && (
                    <BoxNotice
                        notice={message}
                        onClose={() => setMessage(null)}
                    />
                )}
            </div>
        </Box>
    );
}
