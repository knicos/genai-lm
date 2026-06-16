import style from './style.module.css';

interface Props {
    mode: boolean;
    setMode: (mode: boolean) => void;
    startLabel: string;
    endLabel: string;
    disabled?: boolean;
}

export default function ModeSwitch({ mode, setMode, startLabel, endLabel, disabled }: Props) {
    return (
        <fieldset
            className={style.container}
            disabled={disabled}
        >
            <label
                htmlFor="mode-start"
                className={!mode ? style.active : ''}
            >
                <input
                    disabled={disabled}
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
                    disabled={disabled}
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
