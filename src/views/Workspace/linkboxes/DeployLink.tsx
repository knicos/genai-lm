import { useTranslation } from 'react-i18next';
import BoxLink from '../../../components/BoxLink/BoxLink';
import { useAtomValue } from 'jotai';
import { dataTokensReady } from '../../../state/data';

interface Props {
    flip?: boolean;
}

export default function DeployLink({ flip }: Props) {
    const ready = useAtomValue(dataTokensReady);
    const { t } = useTranslation();
    return (
        <BoxLink
            active={ready}
            link="deployment"
            title={t('workflow.deployment')}
            widget="deploy"
            flip={flip}
        />
    );
}
