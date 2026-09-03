import HubIcon from '@mui/icons-material/Hub';
import { useTranslation } from 'react-i18next';
import style from './style.module.css';

export function Component() {
    const { t } = useTranslation();

    return (
        <div className="sidePanel">
            <h2 className={style.title}>{t('audit.title')}</h2>
            <div className={style.tools}>
                <button
                    className={`${style.toolButton} ${style.active}`}
                    type="button"
                    aria-pressed="true"
                    data-widget="audit-phrase-pattern"
                >
                    <HubIcon />
                    <span>{t('audit.phrasePattern')}</span>
                </button>
            </div>
        </div>
    );
}
