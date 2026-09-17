import { useAtomValue } from 'jotai';
import type { WorkflowStage } from '../../../state/workflowSettings';
import { workflowSteps } from '../../../state/workflowSettings';
import Sharing from '../../../workflow/Sharing/Sharing';
import Frame from '../Frame';
import FullSizeGroup from '../FullSizeGroup';
import style from '../style.module.css';
import { useTranslation } from 'react-i18next';
import RawGeneration from '../../../workflow/ChatOutput/RawGeneration';
import RawPrompt from '../../../workflow/Prompt/RawPrompt';
import { BoxButton } from '@genai-fi/base';
import { featureFlagsAtom, uiAuditOutput } from '../../../state/uiState';
import PolicyIcon from '@mui/icons-material/Policy';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { useChangePath } from '../../../hooks/useChangePath';

interface Props {
    registerFrame: (flow: WorkflowStage, element: HTMLDivElement | null) => void;
}

export default function DeploymentFrame(props: Props) {
    const steps = useAtomValue(workflowSteps);
    const { t } = useTranslation();
    const changeFlow = useChangePath();
    const { allowAudit } = useAtomValue(featureFlagsAtom);
    const auditMode = useAtomValue(uiAuditOutput);

    return (
        <Frame
            name="deployment"
            {...props}
        >
            <div
                className={style.titleColumn}
                data-pan
            >
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
                        onClick={() =>
                            changeFlow(auditMode ? { sidepanel: null } : { sidepanel: 'audit', flow: 'deployment' })
                        }
                        active={auditMode}
                    />
                )}
                <BoxButton
                    style={!allowAudit ? { marginBottom: '70px' } : undefined}
                    icon={<AccountTreeIcon />}
                    label={t('training.visualize')}
                    widget="inference-visualize"
                    blur={auditMode}
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
