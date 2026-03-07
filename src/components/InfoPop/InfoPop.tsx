import { Popper, PopperProps } from '@mui/material';
import style from './style.module.css';
import { PropsWithChildren } from 'react';

interface Props extends Omit<PopperProps, 'children'>, PropsWithChildren {
    theme?: 'light' | 'dark';
    offsetY?: number;
    offsetX?: number;
}

export default function InfoPop({ children, offsetY = 0, offsetX = 0, ...props }: Props) {
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
            {...props}
            modifiers={modifiers}
        >
            <div className={`${style.popper} ${style[position]} ${style[props.theme || 'dark']}`}>{children}</div>
        </Popper>
    );
}
