import { VerticalButton } from '@genai-fi/base';
import BoxMenu from '../../components/BoxTitle/BoxMenu';
import { useTranslation } from 'react-i18next';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DatasetIcon from '@mui/icons-material/Dataset';
import { Tooltip } from '@mui/material';

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
            <Tooltip
                arrow
                title={t('data.datasetTooltip')}
            >
                <VerticalButton
                    disabled={disabled}
                    color="primary"
                    variant="text"
                    onClick={onSearch}
                    startIcon={<DatasetIcon color="inherit" />}
                >
                    {t('data.search')}
                </VerticalButton>
            </Tooltip>
            <div style={{ width: '1rem' }} />
            <Tooltip
                arrow
                title={t('data.writeTip')}
            >
                <VerticalButton
                    disabled={disabled}
                    color="primary"
                    variant="text"
                    onClick={onWrite}
                    startIcon={<AddIcon color="inherit" />}
                >
                    {t('data.add')}
                </VerticalButton>
            </Tooltip>
            <Tooltip
                arrow
                title={t('data.uploadTip')}
            >
                <VerticalButton
                    disabled={disabled}
                    color="primary"
                    variant="text"
                    onClick={onUpload}
                    startIcon={<UploadFileIcon color="inherit" />}
                >
                    {t('data.upload')}
                </VerticalButton>
            </Tooltip>
        </BoxMenu>
    );
}
