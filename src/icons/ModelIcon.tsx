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
    if (model.phase === 'untrained') return 'untrained';
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
                console.log('Model status/phase changed, new extra icon:', newIcon);
                setExtraIcon(newIcon);
            };
            model.on('status', h);
            model.on('phase', h);
            model.on('changeLoRA', h);
            h();

            return () => {
                model.off('status', h);
                model.off('phase', h);
                model.off('changeLoRA', h);
            };
        }
    }, [model, ready]);

    return (
        <div className={style.container}>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox={noExtraIcon ? '0 0 48 48' : '0 0 64 64'}
                fill="currentColor"
                width={noExtraIcon ? '1em' : '1.2em'}
                height={noExtraIcon ? '1em' : '1.2em'}
                className={noExtraIcon ? style.smallIcon : style.icon}
            >
                <circle
                    cx={noExtraIcon ? '24' : '32'}
                    cy={noExtraIcon ? '24' : '32'}
                    r={noExtraIcon ? '23' : '31'}
                    className={style.circle}
                />
                <g transform={noExtraIcon ? 'translate(12 10)' : 'translate(16 14)'}>
                    <path
                        d="M0 1 L8 7 L8 25 L0 31 L32 31 L24 25 L24 7 L32 1 Z"
                        className={style.hourglass}
                    />
                    <path
                        d="M0 1 L32 1 L32 3 L0 3 Z"
                        className={style.vocab}
                    />
                    <path
                        d="M8 7 L 24 7 L24 11 L8 11 Z"
                        className={style.layer}
                    />
                    <path
                        d="M8 14 L 24 14 L24 18 L8 18 Z"
                        className={style.layer}
                    />
                    <path
                        d="M8 21 L 24 21 L24 25 L8 25 Z"
                        className={style.layer}
                    />
                    <path
                        d="M0 29 L32 29 L32 31 L0 31 Z"
                        className={style.vocab}
                    />
                </g>
            </svg>
            {!noExtraIcon && (
                <div className={style.extraIcon}>
                    {extraIcon === 'hourglass' && <HourglassTopIcon />}
                    {extraIcon === 'trained' && <SchoolIcon />}
                    {extraIcon === 'untrained' && <RadioButtonUncheckedIcon />}
                    {extraIcon === 'empty' && <DoDisturbIcon />}
                    {extraIcon === 'puzzle' && <ExtensionIcon />}
                </div>
            )}
        </div>
    );
}
