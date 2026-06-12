import { BoxButton } from '../../../components/BoxButton/BoxButton';
import InstructData from '../../../workflow/InstructData/InstructData';
import TuneTraining from '../../../workflow/TuneTraining/TuneTraining';
import Frame from '../Frame';
import style from '../style.module.css';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { useChangePath } from '../../../hooks/useChangePath';
import { useTranslation } from 'react-i18next';

interface Props {
    observer: IntersectionObserver;
    scrollFrame: string;
}

export default function FinetuneFrame({ observer, scrollFrame }: Props) {
    const { t } = useTranslation();
    const changeFlow = useChangePath();

    return (
        <Frame
            name="finetune"
            observer={observer}
            scroll={scrollFrame === 'finetune'}
        >
            <InstructData />
            <TuneTraining />
            <div className={style.buttongroup}>
                <BoxButton
                    icon={<ShowChartIcon />}
                    label={t('training.monitor')}
                    widget="tuning-monitor"
                    onClick={() => changeFlow({ sidepanel: 'tune-log' })}
                    style={{ marginTop: '120px' }}
                />
            </div>
        </Frame>
    );
}
