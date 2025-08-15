import style from './style.module.css';
import CheckIcon from '@mui/icons-material/Check';
import { Spinner } from '@genai-fi/base';
import InfoIcon from '@mui/icons-material/Info';

interface Props {
    done?: boolean;
    busy?: boolean;
    info?: boolean;
}

export default function StatusBox({ done = false, busy = false, info = false }: Props) {
    return (
        <div className={style.status}>
            {!info && done && !busy && (
                <CheckIcon
                    color="success"
                    fontSize="large"
                />
            )}
            {!info && !done && !busy && (
                <CheckIcon
                    color="disabled"
                    fontSize="large"
                />
            )}
            {!info && busy && !done && (
                <div style={{ transform: 'scale(0.5)' }}>
                    <Spinner size="small" />
                </div>
            )}
            {info && done && (
                <InfoIcon
                    htmlColor="white"
                    fontSize="large"
                />
            )}
            {info && !done && (
                <InfoIcon
                    color="disabled"
                    fontSize="large"
                />
            )}
        </div>
    );
}
