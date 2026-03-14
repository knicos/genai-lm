import { useTranslation } from 'react-i18next';
import BoxLink from '../../../components/BoxLink/BoxLink';
import { useAtomValue } from 'jotai';
import { dataTokensReady } from '../../../state/data';
import { modelReady } from '../../../state/model';

interface Props {
    flip?: boolean;
}

export default function TrainerLink({ flip }: Props) {
    const ready1 = useAtomValue(modelReady);
    const ready2 = useAtomValue(dataTokensReady);
    const { t } = useTranslation();

    const ready = ready1 && ready2;

    return (
        <BoxLink
            active={ready}
            link="pretrain"
            title={t('training.title')}
            widget="trainer"
            flip={flip}
        />
    );
}
