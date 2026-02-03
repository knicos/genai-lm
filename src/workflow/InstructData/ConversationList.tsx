import { List, ListImperativeAPI, RowComponentProps } from 'react-window';
import styleModule from './style.module.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Conversation } from '@genai-fi/nanogpt';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useTranslation } from 'react-i18next';
import { names } from './nameGenerator';
import { IconButton } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

interface Props {
    data: Conversation[][];
    onSelect: (index: number) => void;
    onChange?: (data: Conversation[][]) => void;
}

interface RowProps {
    text: string[];
    selected: number;
    onClick: (index: number) => void;
    onDelete: (index: number) => void;
}

function RowComponent({ index, style, text, selected, onClick, onDelete }: RowComponentProps<RowProps>) {
    return (
        <div
            className={styleModule.dataRow}
            style={style}
            role="button"
            onClick={() => onClick && onClick(index)}
        >
            <div className={`${styleModule.rowContent} ${selected === index ? styleModule.selected : ''}`}>
                <div className={styleModule.icon}>
                    <AccountCircleIcon
                        htmlColor="#ddd"
                        fontSize="large"
                    />
                </div>
                <div className={styleModule.column}>
                    <span className={styleModule.dataName}>
                        {names[index % names.length].first} {names[index % names.length].last}
                    </span>
                    <span className={styleModule.dataText}>{text[index]}</span>
                </div>
                <IconButton
                    color="primary"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(index);
                    }}
                >
                    <DeleteOutlineIcon />
                </IconButton>
            </div>
        </div>
    );
}

export default function ConversationList({ data, onSelect, onChange }: Props) {
    const { t } = useTranslation();
    const [selected, setSelected] = useState<number>(-1);
    const listRef = useRef<ListImperativeAPI>(null);
    const lastLen = useRef<number>(data.length);

    useEffect(() => {
        if (selected !== -1) {
            onSelect(selected);
        } else {
            onSelect(0);
        }
    }, [selected, onSelect]);

    useEffect(() => {
        if (data.length > lastLen.current) {
            listRef.current?.scrollToRow({ index: data.length - 1, behavior: 'smooth' });
            setSelected(data.length - 1);
        }
        lastLen.current = data.length;
    }, [data.length]);

    const doDelete = useCallback(
        (index: number) => {
            data.splice(index, 1);
            if (selected >= index) {
                setSelected(selected - 1);
                onSelect(Math.max(0, selected - 1));
            }
            if (onChange) {
                onChange([...data]);
            }
        },
        [data, selected, onChange, onSelect]
    );

    return (
        <div className={styleModule.dataContainer}>
            <List
                listRef={listRef}
                style={{
                    minWidth: '100%',
                    borderBottom: '2px solid rgba(0, 0, 0, 0.06)',
                    borderTop: '2px solid rgba(0, 0, 0, 0.06)',
                }}
                rowComponent={RowComponent}
                rowCount={data.length}
                rowHeight={60}
                rowProps={{
                    selected,
                    text: data.map((conversation) =>
                        conversation[0].content.length === 0
                            ? t('conversation.userPlaceholder')
                            : conversation[0].content
                    ),
                    onClick: setSelected,
                    onDelete: doDelete,
                }}
            />
        </div>
    );
}
