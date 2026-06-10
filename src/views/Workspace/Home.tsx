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
                {workflowItems.map((item, index) => (
                    <Step
                        description={t(`app.workflow.${item.id}_desc`)}
                        step={index + 1}
                        id={item.id}
                        status={item.status}
                        key={item.id}
                    />
                ))}
            </div>
        </div>
    );
}
