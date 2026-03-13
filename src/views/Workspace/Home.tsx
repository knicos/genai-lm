import { useTranslation } from 'react-i18next';
import style from './home.module.css';
import Step from './Step';
import useWorkflowItems from '../../hooks/useWorkflowItems';

export default function Home() {
    const { t } = useTranslation();
    const workflowItems = useWorkflowItems();

    return (
        <div className={style.homeContainer}>
            <div className={style.header}>
                <img
                    src="/logo192.png"
                    alt="GenAI logo"
                    width={192}
                    height={192}
                />
                <div className={style.headerColumn}>
                    <h1>
                        <div className={style.little}>{t('app.little')}</div>
                        {t('app.languageMachine')}
                    </h1>
                    <h2>{t('app.subtitle')}</h2>
                </div>
            </div>
            <div className={style.cards}>
                <Step
                    description={t('app.workflow.model_desc')}
                    step={1}
                    id="model"
                    status={workflowItems[0].status}
                />
                <Step
                    description={t('app.workflow.pretraindata_desc')}
                    step={2}
                    id="pretraindata"
                    status={workflowItems[1].status}
                />
                <Step
                    description={t('app.workflow.pretrain_desc')}
                    step={3}
                    id="pretrain"
                    status={workflowItems[2].status}
                />
                <Step
                    description={t('app.workflow.finetune_desc')}
                    step={4}
                    id="finetune"
                    status={workflowItems[3].status}
                />
                <Step
                    description={t('app.workflow.deployment_desc')}
                    step={5}
                    id="deployment"
                    status={workflowItems[4].status}
                />
            </div>
        </div>
    );
}
