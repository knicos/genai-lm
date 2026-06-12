import { Link } from 'react-router-dom';
import style from './step.module.css';
import { useTranslation } from 'react-i18next';

interface Props {
    step: number;
    description: string;
    id: string;
    flow: string;
}

export default function Step({ step, description, id, flow }: Props) {
    const { t } = useTranslation();
    return (
        <section className={style.step}>
            <div className={style.stepNumber}>{step}</div>
            <div className={style.stepContent}>
                <h2>{t(`workflow.${id}`)}</h2>
                <p>{description}</p>
                <Link to={`/workspace/${id}/${flow}`}>{t('app.startHere')}</Link>
            </div>
        </section>
    );
}
