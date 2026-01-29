import { VerticalButton } from '@genai-fi/base';
import { useTranslation } from 'react-i18next';
import SearchIcon from '@mui/icons-material/Search';
import BoxMenu from '../../components/BoxTitle/BoxMenu';

interface Props {
    disableInspect?: boolean;
    onCreate?: () => void;
    onUpload?: () => void;
    onSearch?: () => void;
    onDownload?: () => void;
    onTools?: () => void;
}

export default function ModelMenu({ onSearch }: Props) {
    const { t } = useTranslation();

    return (
        <BoxMenu>
            {onSearch && (
                <VerticalButton
                    disabled={!onSearch}
                    variant="text"
                    onClick={onSearch}
                    startIcon={<SearchIcon color="inherit" />}
                >
                    {t('model.search')}
                </VerticalButton>
            )}
        </BoxMenu>
    );
}
