import { useAtomValue } from 'jotai';
import Box from '../../components/BoxTitle/Box';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import { loadedModelAtom } from '../../state/model';
import style from './style.module.css';
import { useTranslation } from 'react-i18next';
import SearchDiagContent from '../../components/ModelSearch/SearchDiagContent';
import { Help } from '@genai-fi/base';

export default function Foundation() {
    const { t } = useTranslation();
    const model = useAtomValue(loadedModelAtom);

    return (
        <Help
            message={t('foundation.help')}
            keepOpen
            placement="right"
        >
            <Box
                widget="foundation"
                active={model !== null}
                style={{ maxWidth: '1000px', maxHeight: '80%' }}
                disableHiding
                useParent
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
