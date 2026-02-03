import { useTranslation } from 'react-i18next';
import BoxLink from '../../../components/BoxLink/BoxLink';
import { useAtomValue } from 'jotai';
import useModelLoaded from '../../../utilities/useModelLoaded';
import { modelAtom } from '../../../state/model';

export default function FineTuneLink() {
    const model = useAtomValue(modelAtom);
    const ready = useModelLoaded(model ?? undefined);
    const { t } = useTranslation();
    return (
        <BoxLink
            active={ready}
            link="finetune"
            title={t('finetune.title')}
            status={ready ? 'waiting' : 'disabled'}
            widget="finetune"
        />
    );
}
