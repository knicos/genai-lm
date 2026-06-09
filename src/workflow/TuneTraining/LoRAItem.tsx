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
    disabled?: boolean;
}

export default function LoRAItem({ text, selected, onClick, onDelete, off, disabled }: RowProps) {
    return (
        <div
            className={`${style.dataRow} ${disabled ? style.disabled : ''}`}
            style={style}
            role="button"
            aria-disabled={disabled}
            onClick={disabled ? undefined : onClick}
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
                {onDelete && !off && !disabled && (
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
