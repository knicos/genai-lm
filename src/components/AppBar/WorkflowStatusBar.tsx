import WorkflowBar from '../WorkflowBar/WorkflowBar';
import useWorkflowItems from '../../hooks/useWorkflowItems';

interface Props {
    disabled?: boolean;
    sidepanel?: string;
}

export default function WorkflowStatusBar({ disabled, sidepanel }: Props) {
    const items = useWorkflowItems();

    return (
        <WorkflowBar
            items={items}
            disabled={disabled}
            sidepanel={sidepanel}
        />
    );
}
