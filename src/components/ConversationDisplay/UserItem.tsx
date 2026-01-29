import style from './style.module.css';
import { ExtendedConversation } from './extended';

interface Props {
    item: ExtendedConversation;
}

export default function UserItem({ item }: Props) {
    return <div className={`${style.userItem} ${item.role === 'auto_user' ? style.injected : ''}`}>{item.content}</div>;
}
