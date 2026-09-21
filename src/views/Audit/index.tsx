import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import style from './style.module.css';
import Beaming from './Beaming';
import SynSearch from './SynSearch';
import { VerticalButton } from '@genai-fi/base';
import HighlightIcon from '@mui/icons-material/Highlight';
import FindInPageIcon from '@mui/icons-material/FindInPage';
import { useSetAtom } from 'jotai';
import { uiAuditOutput } from '../../state/uiState';

type AuditModes = 'none' | 'beam' | 'memorization';

export function Component() {
    const { t } = useTranslation();
    const [mode, setMode] = useState<AuditModes>('none');
    const setAuditMode = useSetAtom(uiAuditOutput);

    useEffect(() => {
        setAuditMode(true);
        return () => setAuditMode(false);
    }, [setAuditMode]);

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
                <VerticalButton
                    startIcon={<FindInPageIcon />}
                    onClick={() => setMode('memorization')}
                    aria-pressed={mode === 'memorization'}
                    color={mode === 'memorization' ? 'secondary' : 'primary'}
                >
                    {t('audit.tools.memorization')}
                </VerticalButton>
            </div>
            {mode === 'beam' && <Beaming />}
            {mode === 'memorization' && <SynSearch />}
        </div>
    );
}
