import { useTranslation } from 'react-i18next';
import BoxLink from '../../../components/BoxLink/BoxLink';
import { modelReady } from '../../../state/model';
import { useAtomValue } from 'jotai';

interface Props {
    flip?: boolean;
}

export default function ArchitectureLink({ flip }: Props) {
    const ready = useAtomValue(modelReady);
    const { t } = useTranslation();
    return (
        <BoxLink
            link="model"
            title={t('model.title')}
            widget="architecture"
            flip={flip}
            active={ready}
        />
    );
}
