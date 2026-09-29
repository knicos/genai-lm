import { VerticalButton } from '@genai-fi/base';
import { useTranslation } from 'react-i18next';
import BoxMenu from '../../components/BoxTitle/BoxMenu';
import ModelIcon from '../../icons/ModelIcon';
import UploadIcon from '@mui/icons-material/Upload';

interface Props {
    disableInspect?: boolean;
    onSearch: () => void;
    onUpload: () => void;
}

export default function ModelMenu({ onSearch, onUpload }: Props) {
    const { t } = useTranslation();

    return (
        <BoxMenu>
            <VerticalButton
                variant="text"
                onClick={onSearch}
                startIcon={<ModelIcon noExtraIcon />}
            >
                {t('foundation.examples')}
            </VerticalButton>
            <VerticalButton
                variant="text"
                onClick={onUpload}
                startIcon={<UploadIcon />}
            >
                {t('foundation.upload')}
            </VerticalButton>
        </BoxMenu>
    );
}
