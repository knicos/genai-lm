import { useTranslation } from 'react-i18next';
import BoxLink from '../../../components/BoxLink/BoxLink';
import { modelReady } from '../../../state/model';
import { useAtomValue } from 'jotai';

interface Props {
    flip?: boolean;
}

export default function TextDataLink({ flip }: Props) {
    const ready = useAtomValue(modelReady);
    const { t } = useTranslation();
    return (
        <BoxLink
            link="pretraindata"
            title={t('workflow.pretraindata')}
            widget="textData"
            flip={flip}
            active={ready}
        />
    );
}
