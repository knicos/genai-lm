import StatusBox, { BoxStatus } from '../StatusBox/StatusBox';
import styleModule from './style.module.css';

interface Props {
    title: string;
    button?: React.ReactNode;
    status: BoxStatus;
    style?: React.CSSProperties;
    dark?: boolean;
}

export default function BoxTitle({ title, button, status, style, dark }: Props) {
    return (
        <div
            className={styleModule.title}
            style={style}
        >
            <h2>{title}</h2>
            {button}
            <StatusBox
                status={status}
                dark={dark}
            />
        </div>
    );
}
