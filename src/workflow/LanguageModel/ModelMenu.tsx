import { VerticalButton } from '@genai-fi/base';
import { useTranslation } from 'react-i18next';
import TuneIcon from '@mui/icons-material/Tune';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import BoxMenu from '../../components/BoxTitle/BoxMenu';
import prettyNumber from '../../utilities/prettyNumber';
import style from './style.module.css';
import { estimateParameterCount } from '@genai-fi/nanogpt';
import { useAtomValue } from 'jotai';
import { modelConfigAtom, modelSizeLimit } from '../../state/model';
import ModelIcon from '../../icons/ModelIcon';
import Help from '../../components/Help/Help';
import WarningIcon from '@mui/icons-material/Warning';

interface Props {
    disableInspect?: boolean;
    onSearch?: () => void;
    onShowSettings?: () => void;
    onReset?: () => void;
}

export default function ModelMenu({ onSearch, onShowSettings, onReset }: Props) {
    const { t } = useTranslation();
    const arch = useAtomValue(modelConfigAtom);
    const sizeLimit = useAtomValue(modelSizeLimit) * 1_000_000;
    const estimated = estimateParameterCount(arch);

    return (
        <BoxMenu>
            {onSearch && (
                <VerticalButton
                    disabled={!onSearch}
                    variant="text"
                    onClick={onSearch}
                    startIcon={<ModelIcon />}
                >
                    {t('model.examples')}
                </VerticalButton>
            )}
            <div style={{ width: '1rem' }} />
            <VerticalButton
                startIcon={<RestartAltIcon />}
                onClick={onReset}
            >
                {t('model.reset')}
            </VerticalButton>
            <VerticalButton
                startIcon={<TuneIcon />}
                onClick={onShowSettings}
            >
                {t('training.settings')}
            </VerticalButton>

            <div className={style.parameters}>
                <Help
                    message={t('model.parametersHelp')}
                    inplace
                >
                    {estimated > sizeLimit && (
                        <WarningIcon
                            color="warning"
                            fontSize="medium"
                            sx={{ marginRight: '0.5rem' }}
                        />
                    )}
                    <span className={style.number}>{`${prettyNumber(estimated, t)}`}</span>
                    {`${t('model.parameters')}`}
                </Help>
            </div>
        </BoxMenu>
    );
}
