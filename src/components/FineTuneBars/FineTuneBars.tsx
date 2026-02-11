import { Conversation, Evaluator, ITokeniser, TeachableLLM, Trainer } from '@genai-fi/nanogpt';
import { useEffect, useState } from 'react';
import useModelLoaded from '../../utilities/useModelLoaded';
import style from './style.module.css';
import { PercentageBar } from '@genai-fi/base';
import { Tooltip } from '@mui/material';

const NUM_BARS = 8;

interface Props {
    model: TeachableLLM;
    trainer: Trainer;
    conversations: Conversation[][];
}

function randomSubset<T>(conversations: T[], size: number): T[] {
    // Choose size conversations at random from the set
    const subset: T[] = [];
    const usedIndices = new Set<number>();
    while (subset.length < size && usedIndices.size < conversations.length) {
        const index = Math.floor(Math.random() * conversations.length);
        if (!usedIndices.has(index)) {
            usedIndices.add(index);
            subset.push(conversations[index]);
        }
    }
    return subset;
}

export default function FineTuneBars({ model, trainer, conversations }: Props) {
    const [evaluator, setEvaluator] = useState<Evaluator | null>(null);
    const loaded = useModelLoaded(model);
    const [tokeniser, setTokeniser] = useState<ITokeniser | null>(null);
    const [data, setData] = useState<number[]>([]);
    const [convoSubset, setConvoSubset] = useState<Conversation[][]>([]);

    useEffect(() => {
        if (!loaded) return;
        if (model.tokeniser.trained) {
            setTokeniser(model.tokeniser);
        } else {
            const h = () => {
                if (model.tokeniser.trained) {
                    setTokeniser(model.tokeniser);
                }
            };
            model.tokeniser.on('trainStatus', h);
            return () => {
                model.tokeniser.off('trainStatus', h);
            };
        }
    }, [model, loaded]);

    useEffect(() => {
        if (!loaded) return;
        if (!tokeniser) return;
        const subset = randomSubset(conversations, NUM_BARS);
        setConvoSubset(subset);
        const e = new Evaluator(model.model, subset, tokeniser);
        setEvaluator(e);
        return () => {
            e.dispose();
        };
    }, [model, conversations, loaded, tokeniser]);

    useEffect(() => {
        const h = async () => {
            if (evaluator) {
                try {
                    const loses = await evaluator.evaluate();
                    if (Array.isArray(loses)) {
                        // Normalise to 0-1 and invert so higher is better
                        const maxLoss = Math.log1p(Math.log(model.config.vocabSize) / 2);
                        setData(
                            loses.map((loss) => (isNaN(loss) ? 0 : 1 - Math.min(1, Math.log1p(loss) / maxLoss)) * 100)
                        );
                    }
                } catch {
                    // Ignore
                }
            }
        };
        trainer.on('log', h);
        h();
        return () => {
            trainer.off('log', h);
        };
    }, [trainer, evaluator, model]);

    return (
        <div className={style.fineTuneBars}>
            {data.map((v, i) => {
                const title =
                    convoSubset[i][0].content.slice(0, 100) + (convoSubset[i][0].content.length > 100 ? '...' : '');
                return (
                    <Tooltip
                        key={i}
                        title={title}
                        arrow
                    >
                        <div style={{ height: '100%' }}>
                            <PercentageBar
                                value={v}
                                colour="green"
                                orientation="vertical"
                                hideLabel
                                thickness={15}
                            />
                        </div>
                    </Tooltip>
                );
            })}
        </div>
    );
}
