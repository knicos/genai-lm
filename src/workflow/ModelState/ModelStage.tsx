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
    const [phase, setPhase] = useState(model?.phase || 'untrained');

    useEffect(() => {
        if (model && ready) {
            const h = () => {
                setPhase(model.phase);
            };
            model.on('phase', h);
            return () => {
                model.off('phase', h);
            };
        }
    }, [model, ready]);

    const stage4 = ready && model && model.hasLoRA();
    const stage3 = stage4 || (ready && phase === 'finetuned');
    const stage2 = stage3 || (ready && phase === 'pretrained');
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
