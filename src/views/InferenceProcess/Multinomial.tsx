import { Prediction } from './filterTokens';
import style from './multinomial.module.css';
import { useEffect, useRef, useState } from 'react';
import DiceIcon from '../../components/Dice/Dice';

interface Props {
    predictions: Prediction[];
    lineHeight: number;
    multinomialRand: number | null;
    target?: number;
}

export const MULTINOMIAL_ANIMATION_DURATION = 500; // ms

export default function Multinomial({ predictions, lineHeight, multinomialRand, target }: Props) {
    const [animatedRand, setAnimatedRand] = useState<number>(0);
    const [animating, setAnimating] = useState(false);

    const prevRandRef = useRef<number | null>(null);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        const prev = prevRandRef.current;
        prevRandRef.current = multinomialRand;

        // Reset when sampler is not active
        if (multinomialRand == null) {
            if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
            setAnimating(false);
            // setAnimatedRand(0);
            return;
        }

        // If already had a value, just snap/update without jitter
        if (prev != null) {
            setAnimating(false);
            setAnimatedRand(multinomialRand);
            return;
        }

        const targetValue = multinomialRand;
        const durationMs = MULTINOMIAL_ANIMATION_DURATION;
        const start = performance.now();
        setAnimating(true);

        const tick = (now: number) => {
            const t = Math.min(1, (now - start) / durationMs);

            setAnimatedRand(Math.random());

            if (t < 1) {
                rafRef.current = requestAnimationFrame(tick);
            } else {
                setAnimatedRand(targetValue); // settle exactly
                setAnimating(false);
                rafRef.current = null;
            }
        };

        rafRef.current = requestAnimationFrame(tick);

        return () => {
            if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
        };
    }, [multinomialRand]);

    const indicatorValue = animatedRand ?? 0;

    return (
        <div className={style.wrapper}>
            <DiceIcon value={Math.floor((animatedRand ?? 0) * 6) + 1} />
            <div className={style.container}>
                {predictions.map((p, i) => {
                    const left = predictions[i].start * 100;
                    const width = Math.max(1, Math.ceil((p.end - p.start) * 100));
                    return (
                        <div
                            key={i}
                            className={`${style.bar} ${p.token === target && !animating ? style.target : ''}`}
                            style={{ width: `${width}%`, height: `${lineHeight - 2}px`, marginLeft: `${left}%` }}
                        />
                    );
                })}
                <div
                    className={`${style.indicator} ${animating ? style.animating : ''}`}
                    style={{
                        left: `${Math.floor(indicatorValue * 44) + 2}px`,
                    }}
                />
            </div>
        </div>
    );
}
