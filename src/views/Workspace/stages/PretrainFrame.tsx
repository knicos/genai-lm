import { BoxButton } from '../../../components/BoxButton/BoxButton';
import Frame from '../Frame';
import TextTrainer from '../../../workflow/TextTraining/TextTraining';
import style from '../style.module.css';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { useChangePath } from '../../../hooks/useChangePath';
import { useTranslation } from 'react-i18next';
import { useAtomValue } from 'jotai';
import { workflowSteps } from '../../../state/workflowSettings';

interface Props {
    observer: IntersectionObserver;
    scrollFrame: string;
}

export default function PretrainFrame({ observer, scrollFrame }: Props) {
    const { t } = useTranslation();
    const changeFlow = useChangePath();
    const steps = useAtomValue(workflowSteps);

    return (
        <Frame
            name="pretrain"
            observer={observer}
            scroll={scrollFrame === 'pretrain'}
        >
            <TextTrainer autoTokenise={!steps.has('tokenise')} />
            <div className={style.buttongroup}>
                <BoxButton
                    icon={<ShowChartIcon />}
                    label={t('training.monitor')}
                    widget="training-monitor"
                    onClick={() => changeFlow({ sidepanel: 'training-log' })}
                />
                <BoxButton
                    icon={<AccountTreeIcon />}
                    label={t('training.visualize')}
                    widget="training-visualize"
                    onClick={() =>
                        changeFlow({
                            sidepanel: 'inference-process',
                            query: { vismode: 'training' },
                        })
                    }
                />
            </div>
        </Frame>
    );
}
