import { useTranslation } from 'react-i18next';
import BoxLink from '../../../components/BoxLink/BoxLink';
import { useAtomValue } from 'jotai';
import { modelReady } from '../../../state/model';
import { trainingAnimation } from '../../../state/animations';

interface Props {
    flip?: boolean;
}

export default function ProcessDataLink({ flip }: Props) {
    const ready = useAtomValue(modelReady);
    const istraining = useAtomValue(trainingAnimation);
    const { t } = useTranslation();
    return (
        <BoxLink
            link="pretraindata"
            title={t('workflow.pretraindata')}
            widget="tokeniseData"
            flip={flip}
            active={ready}
            disabled={istraining}
        />
    );
}
