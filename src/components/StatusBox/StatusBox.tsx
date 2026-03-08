import style from './style.module.css';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import InfoIcon from '@mui/icons-material/Info';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BlockIcon from '@mui/icons-material/Block';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { theme } from '../../theme';

export type BoxStatus = 'done' | 'busy' | 'info' | 'disabled' | 'waiting';

interface Props {
    status: BoxStatus;
    dark?: boolean;
}

export default function StatusBox({ status, dark = false }: Props) {
    return (
        <div className={style.status}>
            {status === 'done' && (
                <TaskAltIcon
                    htmlColor={dark ? theme.dark.success : theme.light.success}
                    fontSize="large"
                />
            )}
            {status === 'waiting' && (
                <RadioButtonUncheckedIcon
                    htmlColor={dark ? theme.dark.info : theme.light.info}
                    fontSize="large"
                />
            )}
            {status === 'disabled' && (
                <BlockIcon
                    htmlColor={dark ? theme.dark.disabled : theme.light.disabled}
                    fontSize="large"
                />
            )}
            {status === 'busy' && (
                <AccessTimeIcon
                    htmlColor={dark ? theme.dark.error : theme.light.error}
                    fontSize="large"
                />
            )}
            {status === 'info' && (
                <InfoIcon
                    htmlColor="#75a4e2"
                    fontSize="large"
                />
            )}
        </div>
    );
}
