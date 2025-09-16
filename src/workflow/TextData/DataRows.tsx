import { DataEntry } from './DataListing';
import { List, RowComponentProps } from 'react-window';
import styleModule from './style.module.css';
import { Button } from '@genai-fi/base';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import TextDialog from './TextDialog';

interface Props {
    data: DataEntry;
    onClose: () => void;
}

function RowComponent({
    index,
    style,
    text,
    onClick,
}: RowComponentProps<{ text: string[]; onClick: (index: number) => void }>) {
    return (
        <div
            className={styleModule.dataRow}
            style={style}
            role="button"
            onClick={() => onClick && onClick(index)}
        >
            <span className={styleModule.dataText}>{text[index]}</span>
        </div>
    );
}

export default function DataRows({ data, onClose }: Props) {
    const { t } = useTranslation();
    const [selected, setSelected] = useState<number>(-1);

    return (
        <div className={styleModule.dataContainer}>
            <TextDialog
                open={selected !== -1}
                onClose={() => setSelected(-1)}
                text={data.content[selected]}
            />
            <List
                style={{ minWidth: '100%', borderRadius: '4px', backgroundColor: 'white', border: '1px solid #ccc' }}
                rowComponent={RowComponent}
                rowCount={data.content.length}
                rowHeight={40}
                rowProps={{ text: data.content, onClick: setSelected }}
            />
            <div className={styleModule.buttonRow}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                >
                    {t('data.close')}
                </Button>
            </div>
        </div>
    );
}
