import DeploymentFrame from './stages/DeploymentFrame';
import FinetuneFrame from './stages/FinetuneFrame';
import PretrainFrame from './stages/PretrainFrame';
import DataFrame from './stages/DataFrame';
import ModelFrame from './stages/ModelFrame';
import Home from './Home';
import AuditFrame from './stages/AuditFrame';
import { WorkflowLayout, IConnection } from '@genai-fi/base';
import { FlowType } from '../../hooks/useChangePath';
import ModelState from '../../workflow/ModelState/ModelState';
import style from './style.module.css';
import { useParams } from 'react-router';
import { workflowStages } from '../../state/workflowSettings';
import { useAtomValue } from 'jotai';

interface Props {
    connections: IConnection[];
    registerFrame: (flow: FlowType, element: HTMLDivElement | null) => void;
}

export default function Workflow({ connections, registerFrame }: Props) {
    const { flow } = useParams() as { flow: FlowType };
    const stages = useAtomValue(workflowStages);

    return (
        <>
            {flow === 'home' && <Home />}
            {flow !== 'home' && (
                <WorkflowLayout connections={connections}>
                    {stages.has('model') && <ModelFrame registerFrame={registerFrame} />}
                    {stages.has('data') && <DataFrame registerFrame={registerFrame} />}
                    {stages.has('pretrain') && <PretrainFrame registerFrame={registerFrame} />}
                    {stages.has('deployment') && <DeploymentFrame registerFrame={registerFrame} />}
                    {stages.has('finetune') && <FinetuneFrame registerFrame={registerFrame} />}
                    {stages.has('audit') && <AuditFrame registerFrame={registerFrame} />}
                </WorkflowLayout>
            )}
            {flow !== 'home' && (
                <div className={style.modelOverlay}>
                    <ModelState minimised={stages.has('audit')} />
                </div>
            )}
        </>
    );
}
