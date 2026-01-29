import { useTranslation } from 'react-i18next';
import BoxLink from '../../../components/BoxLink/BoxLink';
import { useAtomValue } from 'jotai';
import { dataTokensReady } from '../../../state/data';

export default function TrainerLink() {
    const ready = useAtomValue(dataTokensReady);
    const { t } = useTranslation();
    return (
        <BoxLink
            active={ready}
            link="pretrain"
            title={t('training.title')}
            status={ready ? 'waiting' : 'disabled'}
            widget="trainer"
        />
    );
}
