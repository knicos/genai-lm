import { useTranslation } from 'react-i18next';
import BoxLink from '../../../components/BoxLink/BoxLink';
import { useAtomValue } from 'jotai';
import useModelLoaded from '../../../utilities/useModelLoaded';
import { modelAtom } from '../../../state/model';

interface Props {
    flip?: boolean;
}

export default function FineTuneLink({ flip }: Props) {
    const model = useAtomValue(modelAtom);
    const ready = useModelLoaded(model ?? undefined);
    const { t } = useTranslation();
    return (
        <BoxLink
            active={ready}
            link="finetune"
            title={t('finetune.title')}
            widget="finetune"
            flip={flip}
        />
    );
}
