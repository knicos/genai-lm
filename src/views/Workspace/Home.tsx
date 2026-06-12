import { useTranslation } from 'react-i18next';
import style from './home.module.css';
import Step from './Step';

const TEMPLATES = [
    {
        variant: 'empty',
        step: 'model',
    },
    {
        variant: 'base',
        step: 'model',
    },
    {
        variant: 'finetune',
        step: 'model',
    },
    {
        variant: 'complete',
        step: 'model',
    },
    {
        variant: 'advanced',
        step: 'model',
    },
];

export default function Home() {
    const { t } = useTranslation();

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
                {TEMPLATES.map((item, index) => (
                    <Step
                        flow={item.step}
                        description={t(`app.workflow.${item.variant}_desc`)}
                        step={index + 1}
                        id={item.variant}
                        key={item.variant}
                    />
                ))}
            </div>
        </div>
    );
}
