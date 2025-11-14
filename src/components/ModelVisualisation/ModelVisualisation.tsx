import style from './style.module.css';
import { TeachableLLM } from '@genai-fi/nanogpt';

interface Props {
    model?: TeachableLLM;
}

export default function ModelVisualisation({ model }: Props) {
    if (!model) return null;

    return (
        <div className={style.container}>
            <div />
        </div>
    );
}
