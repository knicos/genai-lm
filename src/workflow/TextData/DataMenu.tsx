import { VerticalButton } from '@genai-fi/base';
import BoxMenu from '../../components/BoxTitle/BoxMenu';
import { useTranslation } from 'react-i18next';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SearchIcon from '@mui/icons-material/Search';

interface Props {
    disabled?: boolean;
    onWrite: () => void;
    onUpload: () => void;
    onSearch: () => void;
}

export default function DataMenu({ disabled, onWrite, onUpload, onSearch }: Props) {
    const { t } = useTranslation();

    return (
        <BoxMenu>
            <VerticalButton
                disabled={disabled}
                color="primary"
                variant="text"
                onClick={onWrite}
                startIcon={<AddIcon color="inherit" />}
            >
                {t('data.add')}
            </VerticalButton>
            <VerticalButton
                disabled={disabled}
                color="primary"
                variant="text"
                onClick={onUpload}
                startIcon={<UploadFileIcon color="inherit" />}
            >
                {t('data.upload')}
            </VerticalButton>
            <VerticalButton
                disabled={disabled}
                color="primary"
                variant="text"
                onClick={onSearch}
                startIcon={<SearchIcon color="inherit" />}
            >
                {t('data.search')}
            </VerticalButton>
        </BoxMenu>
    );
}
