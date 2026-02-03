import UserItem from './UserItem';
import AssistantItem from './AssistantItem';
import style from './style.module.css';
import { useEffect, useState } from 'react';
import { ExtendedConversation } from './extended';
import { Button } from '@genai-fi/base';
import { useTranslation } from 'react-i18next';
import AddBoxIcon from '@mui/icons-material/AddBox';

interface Props {
    conversation?: ExtendedConversation[];
    editable?: boolean;
}

export default function ConversationDisplay({ conversation, editable = false }: Props) {
    const [extendedConversation, setExtendedConversation] = useState<ExtendedConversation[]>(conversation ?? []);
    const { t } = useTranslation();

    useEffect(() => {
        setExtendedConversation(conversation ?? []);
    }, [conversation]);

    /*if (conversation.length !== lastLength.current || alwaysUpdate) {
        lastLength.current = conversation.length;
        // Inject artificial user messages between consecutive assistant messages
        // Adjust a user message if it is empty
        // Only add new messages, keeping the original objects intact
        const extended: ExtendedConversation[] = [];
        conversation.forEach((part, index) => {
            if (part.role === 'assistant' && extended.length > 0) {
                const lastPart = extended[extended.length - 1];
                if (lastPart.role === 'assistant') {
                    // Inject artificial user message
                    extended.push({
                        role: 'auto_user',
                        content: '',
                    });
                }
            }
            if (index === 0 && part.role === 'assistant') {
                // Inject artificial user message at the start if first message is from assistant
                extended.push({
                    role: 'auto_user',
                    content: '',
                });
            }
            // Adjust empty user messages
            if (part.role === 'user' && part.content === '') {
                extended.push({
                    role: 'auto_user',
                    content: '',
                });
            } else {
            extended.push(part);
            //}
        });
        setExtendedConversation(extended);
    }*/

    return (
        <div className={style.conversationList}>
            {extendedConversation.map((part, index) =>
                part.role === 'user' || part.role === 'auto_user' ? (
                    <UserItem
                        key={index}
                        item={part}
                        editable={editable}
                        onDelete={
                            editable
                                ? () => {
                                      if (editable) {
                                          setExtendedConversation((old) => {
                                              const newConvo = [...old];
                                              newConvo.splice(index, 1);
                                              return newConvo;
                                          });
                                      }
                                  }
                                : undefined
                        }
                    />
                ) : (
                    <AssistantItem
                        key={index}
                        item={part}
                        active={!editable && index === extendedConversation.length - 1}
                        busy={!part._completed}
                        editable={editable}
                        onDelete={
                            editable
                                ? () => {
                                      if (editable) {
                                          setExtendedConversation((old) => {
                                              const newConvo = [...old];
                                              newConvo.splice(index, 1);
                                              return newConvo;
                                          });
                                      }
                                  }
                                : undefined
                        }
                    />
                )
            )}
            {editable && (
                <div className={style.buttonRow}>
                    <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<AddBoxIcon />}
                        disabled={conversation === undefined}
                        onClick={() => {
                            setExtendedConversation((old) => [
                                ...old,
                                {
                                    role:
                                        old.length === 0 || old[old.length - 1].role === 'assistant'
                                            ? 'user'
                                            : 'assistant',
                                    content: '',
                                },
                            ]);
                        }}
                    >
                        {t('conversation.addMessage')}
                    </Button>
                </div>
            )}
        </div>
    );
}
