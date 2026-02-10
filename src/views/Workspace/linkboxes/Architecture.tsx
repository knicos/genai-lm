import { useTranslation } from 'react-i18next';
import BoxLink from '../../../components/BoxLink/BoxLink';

interface Props {
    flip?: boolean;
}

export default function ArchitectureLink({ flip }: Props) {
    const { t } = useTranslation();
    return (
        <BoxLink
            link="model"
            title={t('model.title')}
            widget="architecture"
            flip={flip}
        />
    );
}
