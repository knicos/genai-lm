import { useTranslation } from 'react-i18next';
import BoxLink from '../../../components/BoxLink/BoxLink';

export default function TextDataLink() {
    const { t } = useTranslation();
    return (
        <BoxLink
            link="pretraindata"
            title={t('data.title')}
            status="waiting"
            widget="textData"
        />
    );
}
