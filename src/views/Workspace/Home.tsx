import { useTranslation } from 'react-i18next';
import style from './home.module.css';
import Step from './Step';
import { HomeBanner, Privacy } from '@genai-fi/base';

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

const gitTag = typeof __GIT_TAG__ !== 'undefined' ? __GIT_TAG__ : 'unknown';

export default function Home() {
    const { t } = useTranslation();

    return (
        <div className={style.homeContainer}>
            <HomeBanner
                title={
                    <>
                        <div className={style.little}>{t('app.little')}</div>
                        {t('app.languageMachine')}
                    </>
                }
                subtitle={t('app.subtitle')}
                logoUrl="/logo192.png"
                githubUrl="https://github.com/knicos/genai-lm"
                githubLabel={t('app.githubText')}
            />
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
            <Privacy
                position="bottomLeft"
                appName="lm"
                tag={gitTag || 'notag'}
            />
        </div>
    );
}
