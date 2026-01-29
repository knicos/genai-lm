import Box from '../BoxTitle/Box';
import BoxTitle from '../BoxTitle/BoxTitle';
import { BoxStatus } from '../StatusBox/StatusBox';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MultipleStopIcon from '@mui/icons-material/MultipleStop';
import { IconButton } from '@mui/material';

interface Props {
    title: string;
    link: string;
    widget: string;
    active?: boolean;
    disabled?: boolean;
    status: BoxStatus;
}

export default function BoxLink({ title, link, widget, active, disabled, status }: Props) {
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
                status={status}
                style={{ borderBottom: 'none' }}
                button={
                    <IconButton
                        aria-label={t('app.editStep')}
                        onClick={() => navigate(`/workspace/${link}`)}
                        color="primary"
                    >
                        <MultipleStopIcon color="primary" />
                    </IconButton>
                }
            ></BoxTitle>
        </Box>
    );
}
