import { VerticalButton } from '@genai-fi/base';
import { useTranslation } from 'react-i18next';
import SearchIcon from '@mui/icons-material/Search';
import BuildIcon from '@mui/icons-material/Build';
import DownloadIcon from '@mui/icons-material/Download';
import style from './style.module.css';
import { useAtomValue } from 'jotai';
import { uiDeveloperMode } from '../../state/uiState';

interface Props {
    disableInspect?: boolean;
    onCreate?: () => void;
    onUpload?: () => void;
    onSearch?: () => void;
    onDownload?: () => void;
    onTools?: () => void;
}

export default function ModelMenu({ onSearch, onDownload, onTools, disableInspect }: Props) {
    const { t } = useTranslation();
    const developerMode = useAtomValue(uiDeveloperMode);

    return (
        <div className={style.modelMenu}>
            <VerticalButton
                disabled={!onSearch}
                color="inherit"
                variant="text"
                onClick={onSearch}
                startIcon={<SearchIcon color="inherit" />}
            >
                {t('model.search')}
            </VerticalButton>
            <div className={style.spacer} />
            <VerticalButton
                disabled={!onDownload}
                startIcon={<DownloadIcon color="inherit" />}
                variant="text"
                onClick={onDownload}
                color="inherit"
            >
                {t('model.download')}
            </VerticalButton>
            <div className={style.spacer} />
            {developerMode && (
                <VerticalButton
                    startIcon={<BuildIcon color="inherit" />}
                    variant="text"
                    onClick={onTools}
                    disabled={disableInspect}
                    color="inherit"
                >
                    {t('model.tools')}
                </VerticalButton>
            )}
        </div>
    );
}
