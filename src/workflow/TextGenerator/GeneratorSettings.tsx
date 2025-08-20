import { IconButton, Slider } from '@mui/material';
import style from './style.module.css';
import CloseIcon from '@mui/icons-material/Close';
import { useAtom } from 'jotai';
import { generatorTemperature } from '../../state/generatorSettings';

interface Props {
    open: boolean;
    onClose: () => void;
}

export default function GeneratorSettings({ onClose, open }: Props) {
    const [temperature, setTemperature] = useAtom(generatorTemperature);
    return (
        <div className={open ? style.showSettings : style.settings}>
            <IconButton
                size="large"
                onClick={onClose}
                style={{ position: 'absolute', top: '1rem', right: '1rem' }}
            >
                <CloseIcon fontSize="large" />
            </IconButton>
            <div className={style.settingsInner}>
                <label>Temperature</label>
                <Slider
                    value={temperature}
                    onChange={(_, newValue) => setTemperature(newValue as number)}
                    min={0.5}
                    max={1.5}
                    step={0.1}
                    valueLabelDisplay="auto"
                    size="small"
                />
            </div>
        </div>
    );
}
