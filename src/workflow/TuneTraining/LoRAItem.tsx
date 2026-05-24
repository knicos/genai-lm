import { IconButton } from '@mui/material';
import style from './lora.module.css';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExtensionIcon from '@mui/icons-material/Extension';
import ExtensionOffIcon from '@mui/icons-material/ExtensionOff';

interface RowProps {
    text: string;
    selected: boolean;
    onClick: () => void;
    onDelete?: () => void;
    off?: boolean;
}

export default function LoRAItem({ text, selected, onClick, onDelete, off }: RowProps) {
    return (
        <div
            className={style.dataRow}
            style={style}
            role="button"
            onClick={onClick}
        >
            <div className={`${style.rowContent} ${selected ? style.selected : ''}`}>
                <div className={style.icon}>
                    {off ? (
                        <ExtensionOffIcon
                            htmlColor="#ddd"
                            fontSize="large"
                        />
                    ) : (
                        <ExtensionIcon
                            htmlColor="#ddd"
                            fontSize="large"
                        />
                    )}
                </div>
                <div className={style.column}>
                    <span className={style.dataText}>{text}</span>
                </div>
                {onDelete && !off && (
                    <IconButton
                        color="primary"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                    >
                        <DeleteOutlineIcon />
                    </IconButton>
                )}
            </div>
        </div>
    );
}
