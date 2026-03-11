import WorkflowBar from '../WorkflowBar/WorkflowBar';
import useWorkflowItems from '../../hooks/useWorkflowItems';

export default function WorkflowStatusBar() {
    const items = useWorkflowItems();

    return <WorkflowBar items={items} />;
}
