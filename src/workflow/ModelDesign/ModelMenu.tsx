import { VerticalButton } from '@genai-fi/base';
import { useTranslation } from 'react-i18next';
import BoxMenu from '../../components/BoxTitle/BoxMenu';
import ModelIcon from '../../icons/ModelIcon';
import EditIcon from '@mui/icons-material/Edit';
import UndoIcon from '@mui/icons-material/Undo';

interface Props {
    disableInspect?: boolean;
    onSearch: () => void;
    onEdit: () => void;
    onUndo?: () => void;
}

export default function ModelMenu({ onSearch, onEdit, onUndo }: Props) {
    const { t } = useTranslation();

    return (
        <BoxMenu>
            <VerticalButton
                variant="text"
                onClick={onSearch}
                startIcon={<ModelIcon noExtraIcon />}
            >
                {t('model.examples')}
            </VerticalButton>
            <VerticalButton
                variant="text"
                onClick={onEdit}
                startIcon={<EditIcon />}
            >
                {t('model.edit')}
            </VerticalButton>
            <VerticalButton
                disabled={!onUndo}
                variant="text"
                onClick={onUndo}
                startIcon={<UndoIcon />}
            >
                {t('model.undo')}
            </VerticalButton>
        </BoxMenu>
    );
}
