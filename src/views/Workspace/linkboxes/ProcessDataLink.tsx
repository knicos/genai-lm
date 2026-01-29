import { useTranslation } from 'react-i18next';
import BoxLink from '../../../components/BoxLink/BoxLink';

export default function ProcessDataLink() {
    const { t } = useTranslation();
    return (
        <BoxLink
            link="pretraindata"
            title={t('tokeniser.title')}
            status="waiting"
            widget="tokeniser"
        />
    );
}
