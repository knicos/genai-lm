import style from './icon.module.css';

export default function ModelIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            fill="currentColor"
            width="1em"
            height="1em"
            className={style.icon}
        >
            <path
                d="M0 1 L8 7 L8 25 L0 31 L32 31 L24 25 L24 7 L32 1 Z"
                opacity="0.3"
            />
            <path d="M0 1 L32 1 L32 3 L0 3 Z" />
            <path d="M8 7 L 24 7 L24 11 L8 11 Z" />
            <path d="M8 14 L 24 14 L24 18 L8 18 Z" />
            <path d="M8 21 L 24 21 L24 25 L8 25 Z" />
            <path d="M0 29 L32 29 L32 31 L0 31 Z" />
        </svg>
    );
}
