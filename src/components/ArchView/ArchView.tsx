import { TeachableLLM } from '@genai-fi/nanogpt';
import style from './style.module.css';
import BoxTitle from '../BoxTitle/BoxTitle';
import useModelStatus from '../../utilities/useModelStatus';
import { useEffect, useState } from 'react';

interface Props {
    model?: TeachableLLM;
}

interface BlockState {
    masked: boolean;
    index: number;
}

export default function ArchView({ model }: Props) {
    const status = useModelStatus(model);
    const [ready, setReady] = useState(false);
    const [blocks, setBlocks] = useState<BlockState[]>([]);

    useEffect(() => {
        if (model && ready) {
            const newBlocks: BlockState[] = [];
            for (let i = 0; i < model.config.nLayer; i++) {
                newBlocks.push({ masked: false, index: i });
            }
            setBlocks(newBlocks);
        }
    }, [model, ready]);

    useEffect(() => {
        if (status === 'ready') {
            setReady(true);
        }
    }, [status]);

    return (
        <div className={style.container}>
            <BoxTitle
                title="Architecture"
                done={status === 'ready'}
            />
            {blocks.map((block) => (
                <div
                    key={block.index}
                    className={style.block}
                >
                    <span>Layer {block.index + 1}</span>
                    <span>{block.masked ? 'Masked' : 'Unmasked'}</span>
                </div>
            ))}
        </div>
    );
}
