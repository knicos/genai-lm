import { Popper, PopperProps } from '@mui/material';
import style from './style.module.css';
import { PropsWithChildren, useEffect, useRef, useState } from 'react';

interface Props extends Omit<PopperProps, 'children'>, PropsWithChildren {
    theme?: 'light' | 'dark';
    offsetY?: number;
    offsetX?: number;
    delay?: number;
}

export default function InfoPop({ open, delay, children, offsetY = 0, offsetX = 0, ...props }: Props) {
    const [realOpen, setRealOpen] = useState(open);
    const stillOpen = useRef(open);

    stillOpen.current = open;

    useEffect(() => {
        if (open) {
            const timeout = delay
                ? setTimeout(() => {
                      if (stillOpen.current) setRealOpen(open);
                  }, delay)
                : undefined;
            return () => {
                if (timeout) {
                    clearTimeout(timeout);
                }
            };
        } else {
            setRealOpen(false);
        }
    }, [open, delay]);

    const position = props.placement || 'bottom';

    const modifiers =
        offsetX || offsetY
            ? [
                  {
                      name: 'offset',
                      options: {
                          offset: [offsetX, offsetY],
                      },
                  },
              ]
            : props.modifiers;

    return (
        <Popper
            open={delay ? realOpen : open}
            {...props}
            modifiers={modifiers}
            sx={{ zIndex: 10 }}
        >
            <div className={`${style.popper} ${style[position]} ${style[props.theme || 'dark']}`}>{children}</div>
        </Popper>
    );
}
