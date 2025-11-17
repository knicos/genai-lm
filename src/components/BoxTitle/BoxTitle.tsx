import useWindowSize from '../../utilities/useWindowSize';
import StatusBox, { BoxStatus } from '../StatusBox/StatusBox';
import styleModule from './style.module.css';

const NARROW_SCREEN = 600;

interface Props {
    title: string;
    button?: React.ReactNode;
    status: BoxStatus;
    style?: React.CSSProperties;
    dark?: boolean;
}

export default function BoxTitle({ title, button, status, style, dark }: Props) {
    const { width } = useWindowSize();
    const isNarrow = width < NARROW_SCREEN;

    return (
        <>
            <div
                className={styleModule.title}
                style={style}
            >
                <h2>{title}</h2>
                {!isNarrow && button}
                <StatusBox
                    status={status}
                    dark={dark}
                />
            </div>
            {isNarrow && button}
        </>
    );
}
