import { VerticalButton } from '@genai-fi/base';
import BoxMenu from '../../components/BoxTitle/BoxMenu';
import { useTranslation } from 'react-i18next';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SearchIcon from '@mui/icons-material/Search';

interface Props {
    disabled?: boolean;
    onCreate: () => void;
    onUpload: () => void;
    onSearch: () => void;
}

export default function ModelMenu({ disabled, onCreate, onUpload, onSearch }: Props) {
    const { t } = useTranslation();

    return (
        <BoxMenu>
            <VerticalButton
                disabled={true}
                color="primary"
                variant="outlined"
                onClick={onCreate}
                startIcon={<AddIcon color="inherit" />}
            >
                {t('model.create')}
            </VerticalButton>
            <VerticalButton
                disabled={true}
                color="primary"
                variant="outlined"
                onClick={onUpload}
                startIcon={<UploadFileIcon color="inherit" />}
            >
                {t('model.upload')}
            </VerticalButton>
            <VerticalButton
                disabled={disabled}
                color="primary"
                variant="outlined"
                onClick={onSearch}
                startIcon={<SearchIcon color="inherit" />}
            >
                {t('model.search')}
            </VerticalButton>
        </BoxMenu>
    );
}
