import Box from '../BoxTitle/Box';
import BoxTitle from '../BoxTitle/BoxTitle';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import NextPlanIcon from '@mui/icons-material/NextPlan';
import { IconButton } from '@mui/material';

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

    return (
        <Box
            active={active}
            disabled={disabled}
            widget={widget}
            style={{ alignSelf: 'flex-start' }}
        >
            <BoxTitle
                title={title}
                style={{ borderBottom: 'none' }}
                button={
                    <IconButton
                        aria-label={t('app.editStep')}
                        onClick={() => navigate(`/workspace/${link}`)}
                        color="primary"
                    >
                        <NextPlanIcon
                            style={{ transform: flip ? 'scale(-1, 1)' : 'none' }}
                            fontSize="large"
                            color="secondary"
                        />
                    </IconButton>
                }
            ></BoxTitle>
        </Box>
    );
}
