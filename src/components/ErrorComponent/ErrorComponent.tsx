import { useRouteError } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import logger from '../../utilities/logger';
import style from './style.module.css';
import { Button } from '@genai-fi/base';

interface RouterError {
    status: number;
}

export default function ErrorComponent() {
    const error = useRouteError();
    const { t } = useTranslation();
    const [sent, setSent] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    if ((error as RouterError).status === 404) {
        return (
            <section className="errorView">
                <h1>Page not found</h1>
            </section>
        );
    }

    const json = JSON.stringify(error);
    const str = json === '{}' && 'toString' in (error as Error) ? (error as Error).toString() : 'Unknown';
    const stack = error instanceof Error ? error.stack : undefined;
    const path = window.location.pathname;
    const message = `${str}\n\n${stack ?? ''}\n\nPath: ${path}`;

    logger.error({
        errorString: str,
        userAgent: navigator.userAgent,
        url: window.location.href,
    });

    console.error(error);

    return (
        <div className={style.container}>
            <section className={style.errorView}>
                <h1>{t('app.error.title')}</h1>
                <p>{t('app.error.message')}</p>
                <div className={style.buttons}>
                    <Button
                        variant="outlined"
                        onClick={() => window.location.reload()}
                    >
                        {t('app.error.retry')}
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={() => setShowDetails(!showDetails)}
                    >
                        {showDetails ? t('app.error.hideDetails') : t('app.error.showDetails')}
                    </Button>
                    <Button
                        variant="contained"
                        disabled={sent}
                        onClick={() => {
                            fetch(`${import.meta.env.VITE_APP_API}/report`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ message, application: 'llm', severity: 'error' }),
                            });
                            setSent(true);
                        }}
                    >
                        {t('app.error.send')}
                    </Button>
                </div>
                {showDetails && <p className={style.code}>{message}</p>}
            </section>
        </div>
    );
}
