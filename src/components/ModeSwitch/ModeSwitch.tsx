import style from './style.module.css';

interface Props {
    mode: boolean;
    setMode: (mode: boolean) => void;
    startLabel: string;
    endLabel: string;
}

export default function ModeSwitch({ mode, setMode, startLabel, endLabel }: Props) {
    return (
        <fieldset className={style.container}>
            <label
                htmlFor="mode-start"
                className={!mode ? style.active : ''}
            >
                <input
                    id="mode-start"
                    type="radio"
                    name="mode"
                    className={!mode ? style.active : ''}
                    checked={!mode}
                    onChange={() => setMode(false)}
                />
                <span>{startLabel}</span>
            </label>
            <label
                htmlFor="mode-end"
                className={mode ? style.active : ''}
            >
                <input
                    id="mode-end"
                    type="radio"
                    name="mode"
                    className={mode ? style.active : ''}
                    checked={mode}
                    onChange={() => setMode(true)}
                />
                <span>{endLabel}</span>
            </label>
        </fieldset>
    );
}
