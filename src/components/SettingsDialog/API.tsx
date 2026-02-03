import { useAtom } from 'jotai';
import style from './style.module.css';
import { useTranslation } from 'react-i18next';
import { TextField } from '@mui/material';
import { apiSettingsAtom } from '../../state/api';

export default function APISettings() {
    const { t } = useTranslation();
    const [apiSettings, setApiSettings] = useAtom(apiSettingsAtom);

    return (
        <div className={style.columns}>
            <div className={style.column}>
                <TextField
                    label={t('app.settings.apiEndpoint')}
                    value={apiSettings.endpoint}
                    onChange={(e) => setApiSettings({ ...apiSettings, endpoint: e.target.value })}
                    fullWidth
                />
                <div className={style.spacer} />
                <TextField
                    label={t('app.settings.apiKey')}
                    value={apiSettings.apiKey || ''}
                    onChange={(e) => setApiSettings({ ...apiSettings, apiKey: e.target.value })}
                    fullWidth
                />
            </div>
        </div>
    );
}
