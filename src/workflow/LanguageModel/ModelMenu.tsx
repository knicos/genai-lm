import { VerticalButton } from '@genai-fi/base';
import { useTranslation } from 'react-i18next';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SearchIcon from '@mui/icons-material/Search';
import ExpandCircleDownIcon from '@mui/icons-material/ExpandCircleDown';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import DownloadIcon from '@mui/icons-material/Download';
import style from './style.module.css';
import { useSetAtom } from 'jotai';
import { uiShowVisualisation } from '../../state/uiState';

interface Props {
    disableInspect?: boolean;
    onCreate?: () => void;
    onUpload?: () => void;
    onSearch?: () => void;
    onDownload?: () => void;
}

export default function ModelMenu({ onCreate, onUpload, onSearch, onDownload, disableInspect }: Props) {
    const { t } = useTranslation();
    const setShowVis = useSetAtom(uiShowVisualisation);

    return (
        <div className={style.modelMenu}>
            <VerticalButton
                disabled={!onCreate}
                color="inherit"
                variant="text"
                onClick={onCreate}
                startIcon={<AddIcon color="inherit" />}
            >
                {t('model.create')}
            </VerticalButton>
            <VerticalButton
                disabled={!onUpload}
                color="inherit"
                variant="text"
                onClick={onUpload}
                startIcon={<UploadFileIcon color="inherit" />}
            >
                {t('model.upload')}
            </VerticalButton>
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
            <VerticalButton
                disabled={true}
                startIcon={<QrCode2Icon color="inherit" />}
                variant="text"
                color="inherit"
            >
                {t('model.share')}
            </VerticalButton>
            <div className={style.spacer} />
            <VerticalButton
                startIcon={<ExpandCircleDownIcon color="inherit" />}
                variant="text"
                onClick={() => setShowVis((old) => !old)}
                disabled={disableInspect}
                color="inherit"
            >
                {t('model.openBox')}
            </VerticalButton>
        </div>
    );
}
