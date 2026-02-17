import { VerticalButton } from '@genai-fi/base';
import BoxMenu from '../../components/BoxTitle/BoxMenu';
import TuneIcon from '@mui/icons-material/Tune';
import { useTranslation } from 'react-i18next';
import ShareIcon from '@mui/icons-material/Share';
import StopIcon from '@mui/icons-material/Stop';
import GroupIcon from '@mui/icons-material/Group';

interface Props {
    onShowSettings: () => void;
    onUsers: () => void;
    onStart: () => void;
    onStop: () => void;
    active?: boolean;
}

export default function SharingMenu({ onShowSettings, onUsers, onStart, onStop, active }: Props) {
    const { t } = useTranslation();

    return (
        <BoxMenu>
            <VerticalButton
                startIcon={active ? <StopIcon /> : <ShareIcon />}
                onClick={active ? onStop : onStart}
                color={active ? 'error' : 'success'}
            >
                {active ? t('sharing.stop') : t('sharing.start')}
            </VerticalButton>
            <VerticalButton
                startIcon={<GroupIcon />}
                disabled={!active}
                onClick={onUsers}
            >
                {t('sharing.users')}
            </VerticalButton>
            <VerticalButton
                disabled={!active}
                startIcon={<TuneIcon />}
                onClick={onShowSettings}
            >
                {t('sharing.settings')}
            </VerticalButton>
        </BoxMenu>
    );
}
