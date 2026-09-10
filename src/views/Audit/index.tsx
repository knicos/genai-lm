import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import style from './style.module.css';
import Beaming from './Beaming';
import { VerticalButton } from '@genai-fi/base';
import HighlightIcon from '@mui/icons-material/Highlight';

type AuditModes = 'none' | 'beam';

export function Component() {
    const { t } = useTranslation();
    const [mode, setMode] = useState<AuditModes>('none');

    return (
        <div className="sidePanel">
            <h2 className={style.title}>{t('audit.title')}</h2>
            <div className={style.tools}>
                <VerticalButton
                    startIcon={<HighlightIcon />}
                    onClick={() => setMode('beam')}
                    aria-pressed={mode === 'beam'}
                    color={mode === 'beam' ? 'secondary' : 'primary'}
                >
                    {t('audit.tools.beam')}
                </VerticalButton>
            </div>
            {mode === 'beam' && <Beaming />}
        </div>
    );
}
