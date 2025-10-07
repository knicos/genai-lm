import style from './style.module.css';
import { useEffect, useState } from 'react';

interface Props {
    sample: string;
}

export default function SampleWriter({ sample }: Props) {
    const [slicePointer, setSlicePointer] = useState(40);

    useEffect(() => {
        const interval = setInterval(() => {
            setSlicePointer((prev) => prev + 1);
        }, 20);
        return () => clearInterval(interval);
    }, [sample]);

    return <div className={style.sampleTextExpanded}>{sample.slice(0, slicePointer)}</div>;
}
