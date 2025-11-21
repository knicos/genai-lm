import { IconButton, styled } from '@mui/material';
import useWindowSize from '../../utilities/useWindowSize';
import StatusBox, { BoxStatus } from '../StatusBox/StatusBox';
import styleModule from './style.module.css';
import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useRef } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import MTextField from '@mui/material/TextField';

const NARROW_SCREEN = 600;

const TextField = styled(MTextField)({
    '& input': {
        fontSize: '14pt',
        fontWeight: 'bold',
    },
});

interface Props {
    title: string;
    placeholder?: string;
    button?: React.ReactNode;
    status: BoxStatus;
    style?: React.CSSProperties;
    dark?: boolean;
    setTitle?: (title: string) => void;
}

export default function BoxTitle({ title, button, status, style, dark, setTitle, placeholder }: Props) {
    const { t } = useTranslation();
    const { width } = useWindowSize();
    const editRef = useRef<HTMLDivElement>(null);
    const isNarrow = width < NARROW_SCREEN;

    const doEndEdit = useCallback(() => {
        if (editRef.current) {
            const input = editRef.current.firstElementChild?.firstElementChild as HTMLInputElement;
            input.blur();
        }
    }, []);
    const doStartEdit = useCallback(() => {
        if (editRef.current) {
            const input = editRef.current.firstElementChild?.firstElementChild as HTMLInputElement;
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
                const input = editRef.current.firstElementChild?.firstElementChild as HTMLInputElement;
                input.blur();
            }
        }
    }, []);

    useEffect(() => {
        if (setTitle && editRef.current) {
            const input = editRef.current.firstElementChild?.firstElementChild as HTMLInputElement;
            input?.setAttribute('size', `${Math.max(placeholder?.length || 5, input.value.length)}`);
        }
    }, [title, setTitle, placeholder]);

    return (
        <>
            <div
                className={styleModule.title}
                style={style}
            >
                <h2>
                    {!setTitle && title}
                    {setTitle && (
                        <TextField
                            ref={editRef}
                            hiddenLabel
                            name={t('widget.aria.editTitleInput', { value: title })}
                            placeholder={placeholder}
                            size="small"
                            variant="outlined"
                            onBlur={doEndEdit}
                            value={title}
                            onKeyDown={doKeyDown}
                            onChange={doChangeTitle}
                        />
                    )}
                    {setTitle && (
                        <IconButton
                            aria-label={t('widget.aria.editTitle')}
                            size="small"
                            onClick={doStartEdit}
                            color="inherit"
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                    )}
                </h2>
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
