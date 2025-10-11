import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import detector from 'i18next-browser-languagedetector';

i18n.on('languageChanged', (lng) => {
    document.documentElement.setAttribute('lang', lng);
});

i18n.use(detector)
    .use(Backend)
    .use(initReactI18next)
    .init({
        ns: [],
        backend: {
            loadPath: '/locales/{{lng}}/{{ns}}.json',
        },
        interpolation: {
            escapeValue: false,
        },
        fallbackLng: 'en-GB',
        supportedLngs: ['en-GB', 'fi-FI'],
        detection: {
            caches: [],
        },
    });

export default i18n;
