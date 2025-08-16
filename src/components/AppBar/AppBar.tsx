import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import style from './AppBar.module.css';
import { NativeSelect } from '@mui/material';
import { Link } from 'react-router-dom';

export const LANGS = [{ name: 'en-GB', label: 'English' }];

export default function ApplicationBar() {
    const { t, i18n } = useTranslation();

    const doChangeLanguage = useCallback(
        (e: React.ChangeEvent<HTMLSelectElement>) => {
            i18n.changeLanguage(e.target.value || 'en-GB');
        },
        [i18n]
    );

    return (
        <nav className={style.appbar}>
            <div className={style.toolbar}>
                <Link
                    to="/about"
                    className={style.logo}
                    title="About"
                >
                    <img
                        src="/logo48_bw_invert.png"
                        alt="GenAI logo"
                        width="48"
                        height="48"
                    />
                    <h1>Teachable Generator</h1>
                </Link>
                <div className={style.buttonBar}></div>
                <div className={style.langBar}>
                    <NativeSelect
                        value={i18n.language}
                        onChange={doChangeLanguage}
                        variant="outlined"
                        data-testid="select-lang"
                        inputProps={{ 'aria-label': t('app.language') }}
                    >
                        {LANGS.map((lng) => (
                            <option
                                key={lng.name}
                                value={lng.name}
                            >
                                {lng.label}
                            </option>
                        ))}
                    </NativeSelect>
                </div>
            </div>
        </nav>
    );
}
