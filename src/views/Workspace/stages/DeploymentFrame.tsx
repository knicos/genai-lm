import { useAtomValue } from 'jotai';
import { workflowSteps } from '../../../state/workflowSettings';
import ChatConversation from '../../../workflow/ChatOutput/ChatConversation';
import ChatPrompt from '../../../workflow/Prompt/ChatPrompt';
import Sharing from '../../../workflow/Sharing/Sharing';
import Frame from '../Frame';
import FullSizeGroup from '../FullSizeGroup';
import style from '../style.module.css';
import { useTranslation } from 'react-i18next';
interface Props {
    observer: IntersectionObserver;
    scrollFrame: string;
}

export default function DeploymentFrame({ observer, scrollFrame }: Props) {
    const steps = useAtomValue(workflowSteps);
    const { t } = useTranslation();

    return (
        <Frame
            name="deployment"
            observer={observer}
            scroll={scrollFrame === 'deployment'}
        >
            <div className={style.titleColumn}>
                <h3>{t('generator.title')}</h3>
                <FullSizeGroup widget="conversationOutput">
                    <ChatConversation />
                    <ChatPrompt />
                </FullSizeGroup>
            </div>
            {steps.has('share') && <Sharing withLoRA />}
        </Frame>
    );
}
