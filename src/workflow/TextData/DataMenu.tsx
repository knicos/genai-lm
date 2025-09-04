import { VerticalButton } from '@genai-fi/base';
import BoxMenu from '../../components/BoxTitle/BoxMenu';
import { useTranslation } from 'react-i18next';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ProgressBox from './ProgressBox';

interface Props {
    disabled?: boolean;
    onWrite: () => void;
    onUpload: () => void;
    totalSamples: number;
}

export default function DataMenu({ disabled, onWrite, onUpload, totalSamples }: Props) {
    const { t } = useTranslation();

    return (
        <BoxMenu>
            <VerticalButton
                disabled={disabled}
                color="primary"
                variant="outlined"
                onClick={onWrite}
                startIcon={<AddIcon color="inherit" />}
            >
                {t('data.add')}
            </VerticalButton>
            <VerticalButton
                disabled={disabled}
                color="primary"
                variant="outlined"
                onClick={onUpload}
                startIcon={<UploadFileIcon color="inherit" />}
            >
                {t('data.upload')}
            </VerticalButton>
            <ProgressBox totalSamples={totalSamples} />
        </BoxMenu>
    );
}
