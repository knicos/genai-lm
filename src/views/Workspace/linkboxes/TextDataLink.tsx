import { useTranslation } from 'react-i18next';
import BoxLink from '../../../components/BoxLink/BoxLink';

interface Props {
    flip?: boolean;
}

export default function TextDataLink({ flip }: Props) {
    const { t } = useTranslation();
    return (
        <BoxLink
            link="pretraindata"
            title={t('workflow.pretraindata')}
            widget="textData"
            flip={flip}
        />
    );
}
