import { PropsWithChildren } from 'react';
import style from './style.module.css';

export default function BoxMenu({ children }: PropsWithChildren) {
    return <div className={style.menu}>{children}</div>;
}
