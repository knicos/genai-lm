import style from './style.module.css';
import CheckIcon from '@mui/icons-material/Check';
import InfoIcon from '@mui/icons-material/Info';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { theme } from '../../theme';

interface Props {
    done?: boolean;
    busy?: boolean;
    info?: boolean;
    dark?: boolean;
}

export default function StatusBox({ done = false, busy = false, info = false, dark = false }: Props) {
    return (
        <div className={style.status}>
            {!info && done && !busy && (
                <CheckIcon
                    htmlColor={dark ? theme.dark.success : theme.light.success}
                    fontSize="large"
                />
            )}
            {!info && !done && !busy && (
                <CheckIcon
                    htmlColor={dark ? theme.dark.disabled : theme.light.disabled}
                    fontSize="large"
                />
            )}
            {!info && busy && !done && (
                <AccessTimeIcon
                    htmlColor={dark ? theme.dark.error : theme.light.error}
                    fontSize="large"
                />
            )}
            {info && done && (
                <InfoIcon
                    htmlColor="#75a4e2"
                    fontSize="large"
                />
            )}
            {info && !done && (
                <InfoIcon
                    htmlColor={dark ? theme.dark.disabled : theme.light.disabled}
                    fontSize="large"
                />
            )}
        </div>
    );
}
