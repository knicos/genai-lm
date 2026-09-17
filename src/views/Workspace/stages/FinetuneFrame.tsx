import { BoxButton } from '@genai-fi/base';
import type { WorkflowStage } from '../../../state/workflowSettings';
import InstructData from '../../../workflow/InstructData/InstructData';
import TuneTraining from '../../../workflow/TuneTraining/TuneTraining';
import Frame from '../Frame';
import style from '../style.module.css';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { useChangePath } from '../../../hooks/useChangePath';
import { useTranslation } from 'react-i18next';
import { useAtomValue } from 'jotai';
import { uiAuditOutput } from '../../../state/uiState';

interface Props {
    registerFrame: (flow: WorkflowStage, element: HTMLDivElement | null) => void;
}

export default function FinetuneFrame(props: Props) {
    const { t } = useTranslation();
    const changeFlow = useChangePath();
    const auditMode = useAtomValue(uiAuditOutput);

    return (
        <Frame
            name="finetune"
            {...props}
        >
            <div className={style.titleColumn}>
                <h3>{t('instruct.title')}</h3>
                <InstructData />
            </div>
            <TuneTraining />
            <div className={style.buttongroup}>
                <BoxButton
                    icon={<ShowChartIcon />}
                    label={t('training.monitor')}
                    widget="tuning-monitor"
                    onClick={() => changeFlow({ sidepanel: 'tune-log' })}
                    style={{ marginTop: '120px' }}
                    blur={auditMode}
                />
            </div>
        </Frame>
    );
}
