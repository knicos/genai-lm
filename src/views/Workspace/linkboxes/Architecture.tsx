import { useTranslation } from 'react-i18next';
import BoxLink from '../../../components/BoxLink/BoxLink';

export default function ArchitectureLink() {
    const { t } = useTranslation();
    return (
        <BoxLink
            link="model"
            title={t('model.title')}
            status="waiting"
            widget="architecture"
        />
    );
}
