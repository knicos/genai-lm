import { useTranslation } from 'react-i18next';
import style from './home.module.css';
import Step from './Step';
import { HomeBanner, Privacy } from '@genai-fi/base';
import { useAtomValue } from 'jotai';
import { featureFlagsAtom, FeatureFlags } from '../../state/uiState';

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
        variant: 'audit',
        step: 'model',
        sidepanel: 'audit',
    },
];

const gitTag = typeof __GIT_TAG__ !== 'undefined' ? __GIT_TAG__ : 'unknown';

function filterTemplates(templates: typeof TEMPLATES, features: FeatureFlags) {
    return templates.filter((item) => {
        if (item.variant === 'audit' && !features.allowAudit) {
            return false;
        } else if (item.variant === 'finetune' && !features.allowFineTune) {
            return false;
        }
        return true;
    });
}

export default function Home() {
    const features = useAtomValue(featureFlagsAtom);
    const { t } = useTranslation();

    const templates = filterTemplates(TEMPLATES, features);

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
                {templates.map((item, index) => (
                    <Step
                        flow={item.step}
                        description={t(`app.workflow.${item.variant}_desc`)}
                        step={index + 1}
                        id={item.variant}
                        key={item.variant}
                        sidepanel={item.sidepanel}
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
