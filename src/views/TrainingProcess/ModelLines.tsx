import { useEffect, useRef, useState } from 'react';
import style from './predictions.module.css';

const CURVE = 20;
const HEIGHT = 60;

export default function ModelLines() {
    const ref = useRef<HTMLDivElement>(null);
    const observer = useRef<ResizeObserver>(null);
    const [width, setWidth] = useState(0);

    useEffect(() => {
        if (ref.current) {
            const f = () => {
                if (ref.current) {
                    setWidth(ref.current.getBoundingClientRect().width);
                }
            };

            observer.current = new ResizeObserver(f);
            observer.current.observe(ref.current);
            f();
        }
        return () => {
            observer.current?.disconnect();
        };
    }, []);

    return (
        <div
            ref={ref}
            style={{ width: '100%', height: HEIGHT, position: 'relative' }}
        >
            <svg
                className={style.linesSVG}
                xmlns="http://www.w3.org/2000/svg"
                width="100%"
                height="100%"
            >
                <path
                    d={`M 0 0 C 0 ${CURVE}, 40 ${HEIGHT - CURVE}, 40 ${HEIGHT} C 40 ${
                        HEIGHT - CURVE
                    }, ${width} ${CURVE}, ${width} 0 L 0 0 Z`}
                    fill="#e8f0fe"
                    stroke="#e8f0fe"
                    strokeWidth="5"
                />
            </svg>
        </div>
    );
}
