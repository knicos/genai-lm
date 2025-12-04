import { useTranslation } from 'react-i18next';
import Card from './Card';
import style from './style.module.css';
import AppBar from '../../components/AppBar';

export function Component() {
    const { t } = useTranslation('home');
    return (
        <>
            <AppBar noSettings />
            <div className={style.mainContainer}>
                <div className={style.workspaceContainer}>
                    <section
                        className={style.content}
                        style={{ paddingTop: '2rem' }}
                    >
                        <h1>{t('llmTitle')}</h1>
                        <p>{t('llmDescription')}</p>
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
            </div>
        </>
    );
}
