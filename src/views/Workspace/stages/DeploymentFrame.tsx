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
    return (
        <Frame
            name="deployment"
            observer={observer}
            scroll={scrollFrame === 'deployment'}
        >
            <Sharing />
            <FullSizeGroup widget="conversationOutput">
                <ChatConversation />
                <ChatPrompt />
            </FullSizeGroup>
        </Frame>
    );
}
