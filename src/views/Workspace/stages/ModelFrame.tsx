import CheckModel from '../../../workflow/CheckModel/CheckModel';
import ModelDesign from '../../../workflow/ModelDesign/ModelDesign';
import Frame from '../Frame';
import Foundation from '../../../workflow/Foundation/Foundation';
import { useAtomValue } from 'jotai';
import { workflowSteps } from '../../../state/workflowSettings';

interface Props {
    observer: IntersectionObserver;
    scrollFrame: string;
}

export default function ModelFrame({ observer, scrollFrame }: Props) {
    const steps = useAtomValue(workflowSteps);

    return (
        <Frame
            name="model"
            observer={observer}
            scroll={scrollFrame === 'model'}
        >
            {steps.has('architecture') && <ModelDesign />}
            {steps.has('model') && <Foundation />}
            {steps.has('architecture') && <CheckModel />}
        </Frame>
    );
}
