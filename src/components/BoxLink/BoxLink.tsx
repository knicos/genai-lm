import Box from '../BoxTitle/Box';
import BoxTitle from '../BoxTitle/BoxTitle';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import NextPlanIcon from '@mui/icons-material/NextPlan';
import { IconButton } from '@mui/material';
import style from './style.module.css';
import { useEffect, useRef, useState } from 'react';

interface Props {
    title: string;
    link: string;
    widget: string;
    active?: boolean;
    disabled?: boolean;
    flip?: boolean;
}

export default function BoxLink({ title, link, widget, active, disabled, flip }: Props) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const ref = useRef<HTMLButtonElement>(null);
    const allowed = useRef(false);
    const [becomesActive, setBecomesActive] = useState(false);

    useEffect(() => {
        if (active && allowed.current) {
            ref.current?.focus();
            ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            allowed.current = false;
            setBecomesActive(true);
        }
    }, [active]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            allowed.current = true;
        }, 500);
        return () => clearTimeout(timeout);
    }, []);

    return (
        <Box
            active={active}
            disabled={disabled}
            widget={widget}
            style={{ alignSelf: 'flex-start' }}
            className={`${style.boxLink} ${becomesActive ? style.active : ''}`}
        >
            <BoxTitle
                title={title}
                style={{ borderBottom: 'none' }}
                button={
                    <IconButton
                        aria-label={t('app.editStep')}
                        onClick={() => navigate(`/workspace/${link}`)}
                        color="secondary"
                        disabled={!active}
                        ref={ref}
                    >
                        <NextPlanIcon
                            style={{ transform: flip ? 'scale(-1, 1)' : 'none' }}
                            fontSize="large"
                        />
                    </IconButton>
                }
            ></BoxTitle>
        </Box>
    );
}
