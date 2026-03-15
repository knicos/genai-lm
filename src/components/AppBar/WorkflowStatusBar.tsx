import WorkflowBar from '../WorkflowBar/WorkflowBar';
import useWorkflowItems from '../../hooks/useWorkflowItems';

interface Props {
    disabled?: boolean;
}

export default function WorkflowStatusBar({ disabled }: Props) {
    const items = useWorkflowItems();

    return (
        <WorkflowBar
            items={items}
            disabled={disabled}
        />
    );
}
