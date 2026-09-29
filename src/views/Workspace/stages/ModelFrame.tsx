import type { WorkflowStage } from '../../../state/workflowSettings';
import ModelDesign from '../../../workflow/ModelDesign/ModelDesign';
import Frame from '../Frame';
import Foundation from '../../../workflow/Foundation/Foundation';
import { useAtomValue } from 'jotai';
import { workflowSteps } from '../../../state/workflowSettings';

interface Props {
    registerFrame: (flow: WorkflowStage, element: HTMLDivElement | null) => void;
}

export default function ModelFrame(props: Props) {
    const steps = useAtomValue(workflowSteps);

    return (
        <Frame
            name="model"
            {...props}
        >
            {steps.has('architecture') && (
                <div style={{ marginBottom: 'calc(50% - 50px)' }}>
                    <ModelDesign />
                </div>
            )}
            {steps.has('model') && (
                <div style={{ marginBottom: 'calc(50% - 50px)' }}>
                    <Foundation />
                </div>
            )}
        </Frame>
    );
}
