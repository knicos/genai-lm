import { Button } from '@genai-fi/base';
import style from './card.module.css';
import { PropsWithChildren } from 'react';

interface Props extends PropsWithChildren {
    title: string;
    thumb: string;
    href: string;
    disabled?: boolean;
}

export default function Card({ title, children, thumb, href, disabled }: Props) {
    return (
        <li className={style.card}>
            <div className={`${style.toolContent} ${disabled ? style.disabled : ''}`}>
                <div className={style.thumbContainer}>
                    <img
                        src={thumb}
                        alt={title || ''}
                        width="100%"
                    />
                </div>
                <div className={style.textBox}>
                    <h2 className={style.toolContentTitle}>{title}</h2>
                    {children}
                </div>
            </div>
            <div className={style.buttonContainer}>
                <Button
                    href={href}
                    color="primary"
                    variant="outlined"
                    disabled={disabled}
                >
                    Open
                </Button>
            </div>
        </li>
    );
}
