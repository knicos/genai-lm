import { IconButton, InputAdornment, OutlinedInput } from '@mui/material';
import useWindowSize from '../../hooks/useWindowSize';
import styleModule from './name.module.css';
import { useTranslation } from 'react-i18next';
import { CSSProperties, ReactNode, useCallback, useEffect, useRef } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import TuneIcon from '@mui/icons-material/Tune';

const NARROW_SCREEN = 600;

interface Props {
    title: string;
    placeholder?: string;
    button?: ReactNode;
    style?: CSSProperties;
    startIcon?: ReactNode;
    setTitle: (title: string) => void;
    onSettings?: () => void;
}

export default function ModelName({ title, button, style, setTitle, placeholder, startIcon, onSettings }: Props) {
    const { t } = useTranslation();
    const { width } = useWindowSize();
    const editRef = useRef<HTMLInputElement>(null);
    const isNarrow = width < NARROW_SCREEN;

    const doEndEdit = useCallback(() => {
        if (editRef.current) {
            const input = editRef.current;

            input.blur();
        }
    }, []);
    const doStartEdit = useCallback(() => {
        if (editRef.current) {
            const input = editRef.current;
            input.select();
        }
    }, []);
    const doChangeTitle = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            if (setTitle) setTitle(event.target.value);
        },
        [setTitle]
    );
    const doKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            if (editRef.current) {
                const input = editRef.current;
                input.blur();
            }
        }
    }, []);

    useEffect(() => {
        if (editRef.current) {
            const input = editRef.current.firstElementChild?.firstElementChild as HTMLInputElement;
            input?.setAttribute('size', `${Math.max(placeholder?.length || 5, input.value.length)}`);
        }
    }, [title, placeholder]);

    return (
        <>
            <div
                className={styleModule.title}
                style={style}
            >
                {startIcon}
                <h2>
                    <OutlinedInput
                        inputRef={editRef}
                        name={t('widget.aria.editTitleInput', { value: title })}
                        placeholder={placeholder}
                        size="small"
                        onBlur={doEndEdit}
                        value={title}
                        onKeyDown={doKeyDown}
                        onChange={doChangeTitle}
                        inputProps={{
                            maxLength: 30,
                            minLength: 8,
                        }}
                        endAdornment={
                            <InputAdornment position="end">
                                <IconButton
                                    aria-label={t('widget.aria.editTitle')}
                                    size="small"
                                    onClick={doStartEdit}
                                    color="inherit"
                                >
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            </InputAdornment>
                        }
                    />
                    <span style={{ flexGrow: 1 }} />
                </h2>
                <div className={styleModule.spacer} />
                {!isNarrow && button}
                {onSettings && (
                    <IconButton
                        onClick={onSettings}
                        aria-label={t('widget.aria.settings')}
                        size="small"
                        color="primary"
                    >
                        <TuneIcon fontSize="medium" />
                    </IconButton>
                )}
            </div>
            {isNarrow && button}
        </>
    );
}
