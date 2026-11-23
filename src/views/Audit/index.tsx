import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import style from './style.module.css';
import Beaming from './Beaming';
import SynSearch from './SynSearch';
import { VerticalButton } from '@genai-fi/base';
import HighlightIcon from '@mui/icons-material/Highlight';
import FindInPageIcon from '@mui/icons-material/FindInPage';
import BrushIcon from '@mui/icons-material/Brush';
import { useSetAtom } from 'jotai';
import { uiAuditOutput } from '../../state/uiState';
import Replacer from './Replacer';
import { useLogger } from '../../services/XAPI/useLogger';

type AuditModes = 'none' | 'beam' | 'memorization' | 'eraser' | 'replacer';

export function Component() {
    const logger = useLogger();
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
                    onClick={() => {
                        logger?.alternativesToolClicked();
                        setMode('beam');
                    }}
                    aria-pressed={mode === 'beam'}
                    color={mode === 'beam' ? 'secondary' : 'primary'}
                >
                    {t('audit.tools.beam')}
                </VerticalButton>
                <VerticalButton
                    startIcon={<FindInPageIcon />}
                    onClick={() => {
                        logger?.dataMatchToolClicked();
                        setMode('memorization');
                    }}
                    aria-pressed={mode === 'memorization'}
                    color={mode === 'memorization' ? 'secondary' : 'primary'}
                >
                    {t('audit.tools.memorization')}
                </VerticalButton>
                <VerticalButton
                    startIcon={<BrushIcon />}
                    onClick={() => setMode('replacer')}
                    aria-pressed={mode === 'replacer'}
                    color={mode === 'replacer' ? 'secondary' : 'primary'}
                >
                    {t('audit.tools.replacer')}
                </VerticalButton>
            </div>
            {mode === 'beam' && <Beaming />}
            {mode === 'memorization' && <SynSearch />}
            {mode === 'replacer' && <Replacer />}
        </div>
    );
}
