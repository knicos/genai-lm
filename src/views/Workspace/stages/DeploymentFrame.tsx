import { useAtomValue } from 'jotai';
import { workflowSteps } from '../../../state/workflowSettings';
import ChatConversation from '../../../workflow/ChatOutput/ChatConversation';
import ChatPrompt from '../../../workflow/Prompt/ChatPrompt';
import Sharing from '../../../workflow/Sharing/Sharing';
import Frame from '../Frame';
import FullSizeGroup from '../FullSizeGroup';

interface Props {
    observer: IntersectionObserver;
    scrollFrame: string;
}

export default function DeploymentFrame({ observer, scrollFrame }: Props) {
    const steps = useAtomValue(workflowSteps);

    return (
        <Frame
            name="deployment"
            observer={observer}
            scroll={scrollFrame === 'deployment'}
        >
            <FullSizeGroup widget="conversationOutput">
                <ChatConversation />
                <ChatPrompt />
            </FullSizeGroup>
            {steps.has('share') && <Sharing withLoRA />}
        </Frame>
    );
}
