import { VerticalButton } from '@genai-fi/base';
import BoxMenu from '../../components/BoxTitle/BoxMenu';
import { useTranslation } from 'react-i18next';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AddCommentIcon from '@mui/icons-material/AddComment';
import UploadIcon from '@mui/icons-material/Upload';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';

interface Props {
    onAutoPrompt: () => void;
    onNewConversation: () => void;
    disabled?: boolean;
    onUpload: () => void;
    onDownload: () => void;
    onDeleteAll: () => void;
}

export default function InstructMenu({
    onAutoPrompt,
    onNewConversation,
    disabled,
    onUpload,
    onDownload,
    onDeleteAll,
}: Props) {
    const { t } = useTranslation();

    return (
        <BoxMenu>
            <VerticalButton
                disabled={disabled}
                color="primary"
                variant="text"
                onClick={onNewConversation}
                startIcon={<AddCommentIcon color="inherit" />}
            >
                {t('instruct.newConversation')}
            </VerticalButton>
            <VerticalButton
                disabled={disabled}
                variant="text"
                onClick={onUpload}
                startIcon={<UploadIcon color="inherit" />}
            >
                {t('instruct.upload')}
            </VerticalButton>
            <VerticalButton
                disabled={disabled}
                variant="text"
                onClick={onDownload}
                startIcon={<DownloadIcon color="inherit" />}
            >
                {t('instruct.download')}
            </VerticalButton>
            <VerticalButton
                disabled={disabled}
                variant="text"
                onClick={onDeleteAll}
                startIcon={<DeleteSweepIcon color="inherit" />}
            >
                {t('instruct.deleteAll')}
            </VerticalButton>
            <div style={{ flexGrow: 1 }} />
            <VerticalButton
                disabled={disabled}
                color="primary"
                variant="text"
                onClick={onAutoPrompt}
                startIcon={<AutoAwesomeIcon color="inherit" />}
            >
                {t('instruct.autoTune')}
            </VerticalButton>
        </BoxMenu>
    );
}
