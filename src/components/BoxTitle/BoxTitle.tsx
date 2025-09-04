import StatusBox from '../StatusBox/StatusBox';
import styleModule from './style.module.css';

interface Props {
    title: string;
    button?: React.ReactNode;
    done?: boolean;
    busy?: boolean;
    info?: boolean;
    style?: React.CSSProperties;
}

export default function BoxTitle({ title, button, done, busy, info, style }: Props) {
    return (
        <div
            className={info ? styleModule.infoTitle : styleModule.title}
            style={style}
        >
            <h2>{title}</h2>
            {button}
            <StatusBox
                done={done}
                busy={busy}
                info={info}
            />
        </div>
    );
}
