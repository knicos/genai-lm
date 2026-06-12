import { BoxButton } from '../../../components/BoxButton/BoxButton';
import TextData from '../../../workflow/TextData/TextData';
import TokeniseData from '../../../workflow/TokeniseData/TokeniseData';
import Tokeniser from '../../../workflow/Tokeniser/Tokeniser';
import Frame from '../Frame';
import style from '../style.module.css';
import AbcIcon from '@mui/icons-material/Abc';
import MarginIcon from '@mui/icons-material/Margin';
import { useTranslation } from 'react-i18next';
import { useChangePath } from '../../../hooks/useChangePath';
import { workflowSteps } from '../../../state/workflowSettings';
import { useAtomValue } from 'jotai';

interface Props {
    observer: IntersectionObserver;
    scrollFrame: string;
}

export default function DataFrame({ observer, scrollFrame }: Props) {
    const { t } = useTranslation();
    const changeFlow = useChangePath();
    const steps = useAtomValue(workflowSteps);

    const hasTokenStep = steps.has('tokenise') || steps.has('tokeniser');

    return (
        <Frame
            name="data"
            observer={observer}
            scroll={scrollFrame === 'data'}
        >
            <TextData />
            {hasTokenStep && (
                <div
                    data-widget="container"
                    className={style.subgroup}
                >
                    {steps.has('tokeniser') && (
                        <div className={style.rowGroup}>
                            <Tokeniser />
                            <BoxButton
                                icon={<AbcIcon />}
                                label={t('tokeniser.vocabulary')}
                                widget="vocabulary"
                                onClick={() => changeFlow({ sidepanel: 'vocabulary' })}
                            />
                        </div>
                    )}
                    {steps.has('tokenise') && (
                        <div className={style.rowGroup}>
                            <TokeniseData />
                            <BoxButton
                                icon={<MarginIcon />}
                                label={t('tokeniseData.show')}
                                widget="tokenised-data"
                                onClick={() => changeFlow({ sidepanel: 'tokenised-data' })}
                                style={{ marginTop: '70px' }}
                            />
                        </div>
                    )}
                </div>
            )}
        </Frame>
    );
}
