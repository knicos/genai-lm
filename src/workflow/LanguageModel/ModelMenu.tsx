import { VerticalButton } from '@genai-fi/base';
import { useTranslation } from 'react-i18next';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import TuneIcon from '@mui/icons-material/Tune';
import BoxMenu from '../../components/BoxTitle/BoxMenu';
import prettyNumber from '../../utilities/prettyNumber';
import style from './style.module.css';
import { estimateParameterCount } from '@genai-fi/nanogpt';
import { useAtomValue } from 'jotai';
import { modelConfigAtom } from '../../state/model';

interface Props {
    disableInspect?: boolean;
    onSearch?: () => void;
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    onShowSettings?: () => void;
}

export default function ModelMenu({ onSearch, onZoomIn, onZoomOut, onShowSettings }: Props) {
    const { t } = useTranslation();
    const arch = useAtomValue(modelConfigAtom);

    return (
        <BoxMenu>
            {onSearch && (
                <VerticalButton
                    disabled={!onSearch}
                    variant="text"
                    onClick={onSearch}
                    startIcon={<AccountBalanceIcon color="inherit" />}
                >
                    {t('model.examples')}
                </VerticalButton>
            )}
            <VerticalButton
                variant="text"
                startIcon={<ZoomInIcon color="inherit" />}
                onClick={onZoomIn}
            >
                {t('model.zoomIn')}
            </VerticalButton>
            <VerticalButton
                variant="text"
                startIcon={<ZoomOutIcon color="inherit" />}
                onClick={onZoomOut}
            >
                {t('model.zoomOut')}
            </VerticalButton>
            <VerticalButton
                startIcon={<TuneIcon />}
                onClick={onShowSettings}
            >
                {t('training.settings')}
            </VerticalButton>
            <div className={style.parameters}>
                <span className={style.number}>{`${prettyNumber(estimateParameterCount(arch), t)}`}</span>
                {` ${t('model.parameters')}`}
            </div>
        </BoxMenu>
    );
}
