import { BoxButton } from '@genai-fi/base';
import Frame from '../Frame';
import TextTrainer from '../../../workflow/TextTraining/TextTraining';
import style from '../style.module.css';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { useChangePath } from '../../../hooks/useChangePath';
import { useTranslation } from 'react-i18next';
import { useAtomValue } from 'jotai';
import { WorkflowStage, workflowSteps } from '../../../state/workflowSettings';
import { uiAuditOutput } from '../../../state/uiState';

interface Props {
    registerFrame: (flow: WorkflowStage, element: HTMLDivElement | null) => void;
}

export default function PretrainFrame(props: Props) {
    const { t } = useTranslation();
    const changeFlow = useChangePath();
    const steps = useAtomValue(workflowSteps);
    const auditMode = useAtomValue(uiAuditOutput);

    return (
        <Frame
            name="pretrain"
            {...props}
        >
            <TextTrainer autoTokenise={!steps.has('tokenise')} />
            <div className={style.buttongroup}>
                <BoxButton
                    icon={<ShowChartIcon />}
                    label={t('training.monitor')}
                    widget="training-monitor"
                    onClick={() => changeFlow({ sidepanel: 'training-log', flow: 'pretrain' })}
                    blur={auditMode}
                />
                <BoxButton
                    icon={<AccountTreeIcon />}
                    label={t('training.visualize')}
                    widget="training-visualize"
                    blur={auditMode}
                    onClick={() =>
                        changeFlow({
                            sidepanel: 'inference-process',
                            flow: 'pretrain',
                            query: { vismode: 'training' },
                        })
                    }
                />
            </div>
        </Frame>
    );
}
