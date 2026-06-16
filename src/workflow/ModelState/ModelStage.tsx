import { TeachableLLM } from '@genai-fi/nanogpt';
import style from './style.module.css';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import useModelLoaded from '../../hooks/useModelLoaded';
import { useEffect, useState } from 'react';

interface Props {
    model: TeachableLLM | null;
}

export default function ModelStage({ model }: Props) {
    const ready = useModelLoaded(model ?? undefined);
    const [phase, setPhase] = useState(model?.mode || 'untrained');

    useEffect(() => {
        if (model && ready) {
            const h = () => {
                setPhase(model.mode);
            };
            model.on('mode', h);
            return () => {
                model.off('mode', h);
            };
        }
    }, [model, ready]);

    const stage4 = ready && model && model.hasLoRA();
    const stage3 = stage4 || (ready && phase === 'conversational');
    const stage2 = stage3 || (ready && phase === 'completion');
    const stage1 = stage2 || (ready && phase === 'untrained');

    return (
        <div className={style.modelStage}>
            <div className={style.stageIcon}>
                {stage1 ? <TaskAltIcon htmlColor="white" /> : <RadioButtonUncheckedIcon htmlColor="white" />}
            </div>
            <div className={style.stageIcon}>
                {stage2 ? <TaskAltIcon htmlColor="white" /> : <RadioButtonUncheckedIcon htmlColor="white" />}
            </div>
            <div className={style.stageIcon}>
                {stage3 ? <TaskAltIcon htmlColor="white" /> : <RadioButtonUncheckedIcon htmlColor="white" />}
            </div>
            <div className={style.stageIcon}>
                {stage4 ? <TaskAltIcon htmlColor="white" /> : <RadioButtonUncheckedIcon htmlColor="white" />}
            </div>
        </div>
    );
}
