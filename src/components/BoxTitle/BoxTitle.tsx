import StatusBox from '../StatusBox/StatusBox';
import styleModule from './style.module.css';

interface Props {
    title: string;
    button?: React.ReactNode;
    done?: boolean;
    busy?: boolean;
    info?: boolean;
    style?: React.CSSProperties;
    dark?: boolean;
}

export default function BoxTitle({ title, button, done, busy, info, style, dark }: Props) {
    return (
        <div
            className={styleModule.title}
            style={style}
        >
            <h2>{title}</h2>
            {button}
            <StatusBox
                done={done}
                busy={busy}
                info={info}
                dark={dark}
            />
        </div>
    );
}
