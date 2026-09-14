import { useAtomValue } from 'jotai';
import { workflowSteps } from '../../../state/workflowSettings';
import Sharing from '../../../workflow/Sharing/Sharing';
import Frame from '../Frame';
import FullSizeGroup from '../FullSizeGroup';
import style from '../style.module.css';
import { useTranslation } from 'react-i18next';
import RawGeneration from '../../../workflow/ChatOutput/RawGeneration';
import RawPrompt from '../../../workflow/Prompt/RawPrompt';
import { BoxButton } from '../../../components/BoxButton/BoxButton';
import { featureFlagsAtom } from '../../../state/uiState';
import PolicyIcon from '@mui/icons-material/Policy';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { useChangePath } from '../../../hooks/useChangePath';

interface Props {
    observer: IntersectionObserver;
    scrollFrame: string;
}

export default function DeploymentFrame({ observer, scrollFrame }: Props) {
    const steps = useAtomValue(workflowSteps);
    const { t } = useTranslation();
    const changeFlow = useChangePath();
    const { allowAudit } = useAtomValue(featureFlagsAtom);

    return (
        <Frame
            name="deployment"
            observer={observer}
            scroll={scrollFrame === 'deployment'}
        >
            <div className={style.titleColumn}>
                <h3>{t('generator.title')}</h3>
                <FullSizeGroup widget="chatOutput">
                    <RawGeneration />
                    <RawPrompt record={steps.has('finetune')} />
                </FullSizeGroup>
            </div>
            <div className={style.buttongroup}>
                {allowAudit && (
                    <BoxButton
                        icon={<PolicyIcon />}
                        label={t('generator.audit')}
                        widget="audit-output"
                        onClick={() => changeFlow({ sidepanel: 'audit' })}
                    />
                )}
                <BoxButton
                    style={!allowAudit ? { marginBottom: '70px' } : undefined}
                    icon={<AccountTreeIcon />}
                    label={t('training.visualize')}
                    widget="inference-visualize"
                    onClick={() =>
                        changeFlow({
                            sidepanel: 'inference-process',
                            query: { vismode: 'inference' },
                        })
                    }
                />
                {steps.has('share') && <Sharing withLoRA />}
            </div>
        </Frame>
    );
}
