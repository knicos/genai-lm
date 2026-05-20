import UserItem from './UserItem';
import AssistantItem from './AssistantItem';
import style from './style.module.css';
import { useReducer } from 'react';
import { ExtendedConversation } from './extended';
import { Button } from '@genai-fi/base';
import { useTranslation } from 'react-i18next';
import AddBoxIcon from '@mui/icons-material/AddBox';

interface Props {
    conversation?: ExtendedConversation[];
    editable?: boolean;
    onRetry?: (index: number) => void;
}

export default function ConversationDisplay({ conversation, onRetry, editable = false }: Props) {
    const [, forceRender] = useReducer((x) => x + 1, 0);
    const { t } = useTranslation();

    return (
        <div className={style.conversationList}>
            {conversation?.map((part, index) =>
                part.role === 'user' || part.role === 'auto_user' ? (
                    <UserItem
                        key={index}
                        index={index}
                        item={part}
                        editable={editable}
                        onRetry={onRetry}
                        onDelete={
                            editable
                                ? () => {
                                      if (editable) {
                                          conversation.splice(index, 1);
                                          forceRender();
                                      }
                                  }
                                : undefined
                        }
                    />
                ) : (
                    <AssistantItem
                        key={index}
                        item={part}
                        active={!editable && index === conversation.length - 1}
                        busy={!part._completed}
                        editable={editable}
                        onDelete={
                            editable
                                ? () => {
                                      if (editable) {
                                          conversation.splice(index, 1);
                                          forceRender();
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
                            conversation?.push({
                                role:
                                    conversation.length === 0 ||
                                    conversation[conversation.length - 1].role === 'assistant'
                                        ? 'user'
                                        : 'assistant',
                                content: '',
                            });
                            forceRender();
                        }}
                    >
                        {t('conversation.addMessage')}
                    </Button>
                </div>
            )}
        </div>
    );
}
