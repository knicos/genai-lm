import { VerticalButton } from '@genai-fi/base';
import { useTranslation } from 'react-i18next';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import style from './style.module.css';
import UploadIcon from '@mui/icons-material/Upload';

interface Props {
    onCreate?: () => void;
    onUpload?: () => void;
    onSearch?: () => void;
    onDownload?: () => void;
    onTools?: () => void;
    disabled?: boolean;
}

export default function ModelMenu({ onSearch, onDownload, onUpload, disabled }: Props) {
    const { t } = useTranslation();
    //const developerMode = useAtomValue(uiDeveloperMode);

    return (
        <div className={style.modelMenu}>
            {onUpload && (
                <VerticalButton
                    disabled={disabled}
                    variant="text"
                    onClick={onUpload}
                    startIcon={<UploadIcon color="inherit" />}
                >
                    {t('model.upload')}
                </VerticalButton>
            )}
            {onSearch && (
                <VerticalButton
                    disabled={disabled}
                    variant="text"
                    onClick={onSearch}
                    startIcon={<SearchIcon color="inherit" />}
                >
                    {t('model.search')}
                </VerticalButton>
            )}
            <div className={style.spacer} />
            {onDownload && (
                <VerticalButton
                    disabled={disabled}
                    startIcon={<DownloadIcon color="inherit" />}
                    variant="text"
                    onClick={onDownload}
                >
                    {t('model.download')}
                </VerticalButton>
            )}
        </div>
    );
}
