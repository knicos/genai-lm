import { useAtomValue } from 'jotai';
import Box from '../../components/BoxTitle/Box';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import { loadedModelAtom } from '../../state/model';
import style from './style.module.css';
import { useTranslation } from 'react-i18next';
import SearchDiagContent from '../../components/ModelSearch/SearchDiagContent';
import { Help } from '@genai-fi/base';
import { uiAuditOutput } from '../../state/uiState';

export default function Foundation() {
    const { t } = useTranslation();
    const model = useAtomValue(loadedModelAtom);
    const auditMode = useAtomValue(uiAuditOutput);

    return (
        <Help
            message={t('foundation.help')}
            keepOpen
            placement="right"
            deactivated={auditMode}
        >
            <Box
                widget="foundation"
                active={model !== null}
                style={{ maxWidth: '800px', maxHeight: '75vh', display: 'flex', flexDirection: 'column' }}
                disableHiding
                useParent
                deactivateOnAudit
            >
                <div className={style.container}>
                    <BoxTitle
                        title={t('foundation.title')}
                        status={model ? 'done' : 'waiting'}
                    />
                    <div className={style.content}>
                        <SearchDiagContent
                            trained={true}
                            allowFileOpen
                            model={model || undefined}
                        />
                    </div>
                </div>
            </Box>
        </Help>
    );
}
