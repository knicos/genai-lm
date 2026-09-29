import { useEffect, useState } from 'react';
import { TeachableLLM } from '@genai-fi/nanogpt';
import useModelLoaded from '../hooks/useModelLoaded';
import style from './icon.module.css';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import SchoolIcon from '@mui/icons-material/School';
import DoDisturbIcon from '@mui/icons-material/DoDisturb';
import ExtensionIcon from '@mui/icons-material/Extension';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

type ExtraIcon = 'empty' | 'hourglass' | 'puzzle' | 'untrained' | 'trained';

function calculateExtraIcon(model: TeachableLLM | undefined): ExtraIcon {
    if (!model) return 'empty';
    if (model.status === 'training') return 'hourglass';
    if (model.status === 'busy') return 'hourglass';
    if (model.hasLoRA()) return 'puzzle';
    if (model.mode === 'untrained') return 'untrained';
    else return 'trained';
}

interface Props {
    model?: TeachableLLM;
    noExtraIcon?: boolean;
}

export default function ModelIcon({ model, noExtraIcon }: Props) {
    const [extraIcon, setExtraIcon] = useState<ExtraIcon>('empty');
    const ready = useModelLoaded(model);

    useEffect(() => {
        if (model && ready) {
            const h = () => {
                const newIcon = calculateExtraIcon(model);
                setExtraIcon(newIcon);
            };
            model.on('status', h);
            model.on('mode', h);
            model.on('changeLoRA', h);
            h();

            return () => {
                model.off('status', h);
                model.off('mode', h);
                model.off('changeLoRA', h);
            };
        }
    }, [model, ready]);

    return (
        <div className={style.container}>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox={'0 0 24 24'}
                fill="currentColor"
                width={'1em'}
                height={'1em'}
                className={noExtraIcon ? style.smallIcon : style.icon}
            >
                <g>
                    <path
                        d="M0 2 L24 2"
                        className={style.vocab}
                    />
                    <path
                        d="M6 6 L 18 6"
                        className={style.layer}
                    />
                    <path
                        d="M6 10 L 18 10"
                        className={style.layer}
                    />
                    <path
                        d="M6 14 L 18 14"
                        className={style.layer}
                    />
                    <path
                        d="M6 18 L 18 18"
                        className={style.layer}
                    />
                    <path
                        d="M0 22 L24 22"
                        className={style.vocab}
                    />
                </g>
            </svg>
            {!noExtraIcon && (
                <div className={style.extraIcon}>
                    {extraIcon === 'hourglass' && <HourglassTopIcon fontSize="inherit" />}
                    {extraIcon === 'trained' && <SchoolIcon fontSize="inherit" />}
                    {extraIcon === 'untrained' && <RadioButtonUncheckedIcon fontSize="inherit" />}
                    {extraIcon === 'empty' && <DoDisturbIcon fontSize="inherit" />}
                    {extraIcon === 'puzzle' && <ExtensionIcon fontSize="inherit" />}
                </div>
            )}
        </div>
    );
}
