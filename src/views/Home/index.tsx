import { useTranslation } from 'react-i18next';
import Card from './Card';
import style from './style.module.css';

export function Component() {
    const { t } = useTranslation('home');
    return (
        <div className={style.container}>
            <header>
                <img
                    src="/logo192.png"
                    alt="Generation AI Logo"
                    width="128"
                />
                <h1>{t('title')}</h1>
            </header>
            <section className={style.content}>
                <h1>{t('llmTitle')}</h1>
                <p>{t('llmDescription')}</p>
                <h2 className={style.contentSubTitle}>{t('activity')}</h2>
                <ul className={style.cardList}>
                    <Card
                        title={t('activities.pretrain.title')}
                        thumb="/images/pretrain1.png"
                        href="/workspace/pretrain"
                    >
                        <p>{t('activities.pretrain.description')}</p>
                    </Card>
                    <Card
                        title={t('activities.classifier.title')}
                        thumb="/images/pretrain1.png"
                        href="/workspace/classifier"
                        disabled
                    >
                        <p>{t('activities.classifier.description')}</p>
                    </Card>
                    <Card
                        title={t('activities.chatbot.title')}
                        thumb="/images/pretrain1.png"
                        href="/workspace/chatbot"
                        disabled
                    >
                        <p>{t('activities.chatbot.description')}</p>
                    </Card>
                </ul>
            </section>
            <section className={style.content}>
                <h1>{t('howItWorksTitle')}</h1>
                <p>{t('howItWorksContent')}</p>
            </section>
            <section
                className={style.content}
                style={{ marginBottom: '4rem' }}
            >
                <h1>{t('whoMadeItTitle')}</h1>
                <p>{t('whoMadeItContent')}</p>
            </section>
        </div>
    );
}
