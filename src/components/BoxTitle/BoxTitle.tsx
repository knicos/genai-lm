import StatusBox from '../StatusBox/StatusBox';
import style from './style.module.css';

interface Props {
    title: string;
    button?: React.ReactNode;
    done?: boolean;
    busy?: boolean;
    info?: boolean;
}

export default function BoxTitle({ title, button, done, busy, info }: Props) {
    return (
        <div className={info ? style.infoTitle : style.title}>
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
